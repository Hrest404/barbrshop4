import { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:4000/api/v1";

type BookingData = {
  serviceId: string | null;
  barberId: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string;
};

function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>({
    serviceId: null,
    barberId: null,
    date: null,
    time: null,
    name: WebApp.initDataUnsafe?.user?.first_name || "",
    phone: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([
    { id: "any", name: "Любой свободный", photo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=500&auto=format&fit=crop" }
  ]);

  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{time: string; barberId: string}[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/services`).then(res => res.json()).then(d => Array.isArray(d) && setServices(d));
    fetch(`${API_URL}/barbers`).then(res => res.json()).then(d => {
      if (Array.isArray(d)) {
        setBarbers([{ id: "any", name: "Любой свободный", photo_url: "" }, ...d]);
      }
    });
  }, []);

  useEffect(() => {
    if (step === 3 && data.serviceId) {
      let url = `${API_URL}/availability/days?serviceIds=${data.serviceId}`;
      if (data.barberId && data.barberId !== 'any') url += `&barberId=${data.barberId}`;
      fetch(url).then(res => res.json()).then(resData => resData.days && setAvailableDays(resData.days));
    }
  }, [step, data.serviceId, data.barberId]);

  useEffect(() => {
    if (step === 3 && data.date && data.serviceId) {
      let url = `${API_URL}/availability?date=${data.date}&serviceIds=${data.serviceId}`;
      if (data.barberId && data.barberId !== 'any') url += `&barberId=${data.barberId}`;
      fetch(url).then(res => res.json()).then(resData => resData.slots && setAvailableSlots(resData.slots));
    }
  }, [data.date, data.serviceId, data.barberId, step]);

  useEffect(() => {
    WebApp.MainButton.onClick(handleMainButtonClick);
    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
    };
  }, [step, data, availableSlots]);

  useEffect(() => {
    updateMainButton();
  }, [step, data, isLoading]);

  const updateMainButton = () => {
    if (isLoading) {
      WebApp.MainButton.showProgress();
      return;
    }
    WebApp.MainButton.hideProgress();
    
    if (step === 1 && data.serviceId) {
      WebApp.MainButton.setText("Далее").show();
    } else if (step === 2 && data.barberId) {
      WebApp.MainButton.setText("Далее").show();
    } else if (step === 3 && data.date && data.time) {
      WebApp.MainButton.setText("Далее").show();
    } else if (step === 4 && data.name && data.phone) {
      WebApp.MainButton.setText("Подтвердить").show();
    } else if (step === 5) {
      WebApp.MainButton.setText("Подтвердить запись").show();
    } else {
      WebApp.MainButton.hide();
    }
  };

  const handleMainButtonClick = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      await handleConfirm();
    }
  };

  const handleConfirm = async () => {
    setBookingError(null);
    setIsLoading(true);
    
    let finalBarberId = data.barberId;
    if (finalBarberId === 'any') {
      const slot = availableSlots.find(s => s.time === data.time);
      if (slot) finalBarberId = slot.barberId;
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: [data.serviceId],
          barberId: finalBarberId,
          date: data.date,
          time: data.time,
          clientName: data.name,
          clientPhone: data.phone
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error === 'SLOT_TAKEN' ? 'Время занято' : 'Ошибка');
      
      WebApp.MainButton.hide();
      navigate(`/booking/${resData.manage_token}`);
    } catch (err: any) {
      setBookingError(err.message);
      WebApp.showAlert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #0A0A0B)', color: 'var(--tg-theme-text-color, #E5E5E5)', minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold mb-6 text-brand">Barbershop Booking</h1>
      
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold mb-4">Выберите услугу</h2>
          {services.map(s => (
            <div key={s.id} onClick={() => setData({ ...data, serviceId: s.id })} 
                 className={`p-4 border rounded-xl cursor-pointer ${data.serviceId === s.id ? 'border-brand' : 'border-dark-border'}`}>
              <div className="font-bold">{s.name}</div>
              <div className="text-sm opacity-70">{s.price} • {s.duration_min} мин</div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold mb-4">Выберите мастера</h2>
          {barbers.map(b => (
            <div key={b.id} onClick={() => setData({ ...data, barberId: b.id })}
                 className={`p-4 border rounded-xl cursor-pointer flex items-center gap-3 ${data.barberId === b.id ? 'border-brand' : 'border-dark-border'}`}>
              {b.photo_url && <img src={b.photo_url} className="w-12 h-12 rounded-full object-cover" />}
              <div className="font-bold">{b.name}</div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Выберите дату</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {availableDays.map(d => (
              <div key={d} onClick={() => setData({ ...data, date: d, time: null })}
                   className={`p-2 text-center rounded border ${data.date === d ? 'border-brand text-brand' : 'border-dark-border'}`}>
                {new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            ))}
          </div>

          {data.date && (
            <>
              <h2 className="text-xl font-bold mb-4">Выберите время</h2>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(s => (
                  <div key={s.time} onClick={() => setData({ ...data, time: s.time })}
                       className={`p-2 text-center rounded border ${data.time === s.time ? 'bg-brand text-black font-bold' : 'border-dark-border'}`}>
                    {s.time}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Контактные данные</h2>
          <input type="text" placeholder="Имя" value={data.name} onChange={e => setData({...data, name: e.target.value})}
                 className="w-full p-3 rounded bg-dark-surface border border-dark-border outline-none" style={{ color: 'var(--tg-theme-text-color)' }} />
          <input type="tel" placeholder="Телефон" value={data.phone} onChange={e => setData({...data, phone: e.target.value})}
                 className="w-full p-3 rounded bg-dark-surface border border-dark-border outline-none" style={{ color: 'var(--tg-theme-text-color)' }} />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold mb-4">Подтверждение</h2>
          <div className="p-4 rounded border border-dark-border bg-dark-surface">
            <p><strong>Дата:</strong> {data.date} в {data.time}</p>
            <p><strong>Имя:</strong> {data.name}</p>
            <p><strong>Телефон:</strong> {data.phone}</p>
          </div>
          {bookingError && <p className="text-red-500 mt-2">{bookingError}</p>}
        </div>
      )}

      {step > 1 && (
        <button onClick={() => setStep(step - 1)} className="mt-8 text-brand font-bold uppercase text-sm tracking-wider">
          Назад
        </button>
      )}
    </div>
  );
}

function ManageBooking() {
  const { token } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/bookings/${token}`)
      .then(res => res.json())
      .then(d => { setBooking(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!WebApp.showConfirm) {
      if (!confirm('Отменить?')) return;
    } else {
      WebApp.showConfirm('Отменить запись?', async (ok) => {
        if (!ok) return;
        await cancel();
      });
      return;
    }
    await cancel();
  };

  const cancel = async () => {
    await fetch(`${API_URL}/bookings/${token}/cancel`, { method: 'POST' });
    setBooking({ ...booking, status: 'cancelled' });
    WebApp.showAlert('Запись отменена');
  };

  if (loading) return <div className="p-4 text-center">Загрузка...</div>;
  if (!booking) return <div className="p-4 text-center">Не найдено</div>;

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="p-4 h-screen" style={{ backgroundColor: 'var(--tg-theme-bg-color, #0A0A0B)', color: 'var(--tg-theme-text-color, #E5E5E5)' }}>
      <h1 className="text-2xl font-bold mb-6">Запись {isCancelled ? '(Отменена)' : ''}</h1>
      <div className="p-4 border border-dark-border rounded bg-dark-surface mb-6">
        <p className="mb-2"><strong>Мастер:</strong> {booking.barber.name}</p>
        <p className="mb-2"><strong>Услуга:</strong> {booking.services.map((s:any)=>s.name).join(', ')}</p>
        <p className="mb-2"><strong>Дата:</strong> {new Date(booking.starts_at).toLocaleString('ru-RU')}</p>
        <p><strong>Сумма:</strong> {booking.total_price}</p>
      </div>
      
      {!isCancelled && (
        <button onClick={handleCancel} className="w-full p-4 rounded bg-red-500/20 text-red-500 font-bold border border-red-500/50">
          Отменить запись
        </button>
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Auth validation with backend
    if (WebApp.initData) {
      fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: WebApp.initData })
      });
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<BookingFlow />} />
      <Route path="/booking/:token" element={<ManageBooking />} />
    </Routes>
  );
}
