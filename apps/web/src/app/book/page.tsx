"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const mockSlots = ["10:00", "11:00", "12:00", "14:00", "15:00"];

type BookingData = {
  serviceId: string | null;
  barberId: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string;
};

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>({
    serviceId: null,
    barberId: null,
    date: null,
    time: null,
    name: "",
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
  const [manageToken, setManageToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/v1/services")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(console.error);
      
    fetch("http://localhost:4000/api/v1/barbers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBarbers([
            { id: "any", name: "Любой свободный", photo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=500&auto=format&fit=crop" },
            ...data
          ]);
        }
      })
      .catch(console.error);
  }, []);

  // Загружаем доступные дни при переходе на шаг 3
  useEffect(() => {
    if (step === 3 && data.serviceId) {
      let url = `http://localhost:4000/api/v1/availability/days?serviceIds=${data.serviceId}`;
      if (data.barberId && data.barberId !== 'any') {
        url += `&barberId=${data.barberId}`;
      }
      fetch(url)
        .then(res => res.json())
        .then(resData => {
          if (resData.days) setAvailableDays(resData.days);
        })
        .catch(console.error);
    }
  }, [step, data.serviceId, data.barberId]);

  // Загружаем доступные слоты при выборе даты
  useEffect(() => {
    if (step === 3 && data.date && data.serviceId) {
      let url = `http://localhost:4000/api/v1/availability?date=${data.date}&serviceIds=${data.serviceId}`;
      if (data.barberId && data.barberId !== 'any') {
        url += `&barberId=${data.barberId}`;
      }
      fetch(url)
        .then(res => res.json())
        .then(resData => {
          if (resData.slots) setAvailableSlots(resData.slots);
        })
        .catch(console.error);
    }
  }, [data.date, data.serviceId, data.barberId, step]);

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleConfirm = async () => {
    setBookingError(null);
    setIsLoading(true);
    
    // В реальном приложении нужно брать barberId из выбранного слота, если выбран "any"
    let finalBarberId = data.barberId;
    if (finalBarberId === 'any') {
      const slot = availableSlots.find(s => s.time === data.time);
      if (slot) finalBarberId = slot.barberId;
    }

    try {
      const res = await fetch("http://localhost:4000/api/v1/bookings", {
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
      if (!res.ok) {
        if (resData.error === 'SLOT_TAKEN') {
          throw new Error('К сожалению, это время уже занято. Пожалуйста, выберите другое.');
        }
        throw new Error(resData.error || 'Произошла ошибка при бронировании');
      }
      
      if (resData.manage_token) {
        setManageToken(resData.manage_token);
      }
      nextStep();
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getService = () => services.find((s) => s.id === data.serviceId);
  const getBarber = () => barbers.find((b) => b.id === data.barberId);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-dark-muted hover:text-brand transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            На главную
          </Link>
          <div className="text-sm font-medium text-dark-muted tracking-widest uppercase">
            Шаг {Math.min(step, 5)} из 5
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Step 1: Услуга */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Выберите услугу</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <label key={service.id} className={`block cursor-pointer p-5 rounded-xl border transition-all ${data.serviceId === service.id ? 'border-brand bg-brand/5' : 'border-dark-border hover:border-brand/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="service"
                          className="w-5 h-5 text-brand bg-dark-bg border-dark-border focus:ring-brand accent-brand"
                          checked={data.serviceId === service.id}
                          onChange={() => setData({ ...data, serviceId: service.id })}
                        />
                        <div>
                          <div className="font-semibold text-lg">{service.name}</div>
                          <div className="text-sm text-dark-muted mt-1">{service.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand whitespace-nowrap">{service.price}</div>
                        <div className="text-sm text-dark-muted">{service.duration}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={!data.serviceId}
                  className="px-8 py-3 bg-brand text-dark-bg font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Барбер */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Выберите мастера</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {barbers.map((barber) => (
                  <label key={barber.id} className={`block cursor-pointer p-3 rounded-xl border text-center transition-all ${data.barberId === barber.id ? 'border-brand bg-brand/5' : 'border-dark-border hover:border-brand/50'}`}>
                    <input
                      type="radio"
                      name="barber"
                      className="hidden"
                      checked={data.barberId === barber.id}
                      onChange={() => setData({ ...data, barberId: barber.id })}
                    />
                    <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                      <Image src={barber.photo_url || ""} alt={barber.name} fill className={`object-cover ${data.barberId === barber.id ? '' : 'grayscale'}`} />
                    </div>
                    <div className="font-medium text-sm">{barber.name}</div>
                  </label>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="px-6 py-3 border border-dark-border text-dark-text font-semibold rounded hover:bg-dark-border transition-colors">
                  Назад
                </button>
                <button
                  onClick={nextStep}
                  disabled={!data.barberId}
                  className="px-8 py-3 bg-brand text-dark-bg font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Дата */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Выберите дату</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableDays.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-dark-muted">Нет доступных дат на ближайшее время</div>
                ) : (
                  availableDays.map((dateStr) => {
                    const date = new Date(dateStr);
                    const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
                    const dayNum = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                    
                    return (
                      <label key={dateStr} className={`block cursor-pointer p-4 rounded-xl border text-center transition-all ${data.date === dateStr ? 'border-brand bg-brand/5' : 'border-dark-border hover:border-brand/50'}`}>
                        <input
                          type="radio"
                          name="date"
                          className="hidden"
                          checked={data.date === dateStr}
                          onChange={() => setData({ ...data, date: dateStr, time: null })}
                        />
                        <div className="text-dark-muted text-sm capitalize mb-1">{dayName}</div>
                        <div className="font-bold text-lg">{dayNum}</div>
                      </label>
                    );
                  })
                )}
              </div>
              
              {data.date && (
                <div className="mt-8 animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold mb-4">Доступное время</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableSlots.length === 0 ? (
                      <div className="w-full py-2 text-dark-muted">В этот день нет свободного времени</div>
                    ) : (
                      availableSlots.map((slot) => (
                        <label key={slot.time} className={`block cursor-pointer px-5 py-3 rounded border font-medium transition-all ${data.time === slot.time ? 'border-brand bg-brand text-dark-bg' : 'border-dark-border hover:border-brand/50'}`}>
                          <input
                            type="radio"
                            name="time"
                            className="hidden"
                            checked={data.time === slot.time}
                            onChange={() => setData({ ...data, time: slot.time })}
                          />
                          {slot.time}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="px-6 py-3 border border-dark-border text-dark-text font-semibold rounded hover:bg-dark-border transition-colors">
                  Назад
                </button>
                <button
                  onClick={nextStep}
                  disabled={!data.date || !data.time}
                  className="px-8 py-3 bg-brand text-dark-bg font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Контакты */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Ваши данные</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Имя</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded p-3 text-dark-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded p-3 text-dark-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="+998 90 000 00 00"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="px-6 py-3 border border-dark-border text-dark-text font-semibold rounded hover:bg-dark-border transition-colors">
                  Назад
                </button>
                <button
                  onClick={nextStep}
                  disabled={!data.name || !data.phone}
                  className="px-8 py-3 bg-brand text-dark-bg font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                >
                  Перейти к подтверждению
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Подтверждение */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">Проверьте данные записи</h2>
              
              <div className="bg-dark-bg border border-dark-border rounded-xl p-6 mb-8 space-y-4">
                <div className="flex justify-between border-b border-dark-border pb-4">
                  <div>
                    <div className="text-sm text-dark-muted mb-1">Услуга</div>
                    <div className="font-semibold text-lg">{getService()?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand text-lg">{getService()?.price}</div>
                    <div className="text-sm text-dark-muted">{getService()?.duration}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-12 h-12 relative rounded-full overflow-hidden border border-dark-border">
                    <Image src={getBarber()?.image || ""} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm text-dark-muted mb-1">Мастер</div>
                    <div className="font-semibold">{getBarber()?.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-dark-border">
                  <div>
                    <div className="text-sm text-dark-muted mb-1">Дата и время</div>
                    <div className="font-semibold">{new Date(data.date!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, {data.time}</div>
                  </div>
                  <div>
                    <div className="text-sm text-dark-muted mb-1">Клиент</div>
                    <div className="font-semibold">{data.name}</div>
                    <div className="text-sm text-dark-muted">{data.phone}</div>
                  </div>
                </div>
                {bookingError && (
                  <div className="mt-4 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {bookingError}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-6">
                <button onClick={prevStep} disabled={isLoading} className="px-6 py-3 border border-dark-border text-dark-text font-semibold rounded hover:bg-dark-border transition-colors disabled:opacity-50">
                  Изменить
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-8 py-3 bg-brand text-dark-bg font-bold rounded flex items-center gap-2 hover:bg-brand-hover transition-colors disabled:opacity-80"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark-bg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Сохранение...
                    </>
                  ) : "Подтвердить запись"}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="animate-in zoom-in-95 duration-500 text-center py-12">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Вы успешно записаны!</h2>
              <p className="text-dark-muted max-w-md mx-auto mb-8">
                Ждем вас {new Date(data.date!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {data.time} у мастера {getBarber()?.name}.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {manageToken && (
                  <Link href={`/booking/${manageToken}`} className="px-8 py-3 bg-brand text-dark-bg font-bold rounded hover:bg-brand-hover transition-colors">
                    Управление записью
                  </Link>
                )}
                <Link href="/" className="px-8 py-3 bg-dark-surface border border-dark-border text-dark-text font-semibold rounded hover:bg-dark-border transition-colors">
                  На главную
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
