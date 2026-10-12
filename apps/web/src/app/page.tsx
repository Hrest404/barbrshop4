"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// Мок-данные услуг с качественными фото
const services = [
  {
    id: 1,
    number: "01",
    name: "Мужская стрижка",
    category: "Classic & Modern",
    description: "Классическая или модельная стрижка с учетом формы черепа и текстуры волос. Включает мытье головы премиальной косметикой и стайлинг.",
    duration: "60 мин",
    price: "2 500 ₽",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 2,
    number: "02",
    name: "Стрижка бороды",
    category: "Beard Craft",
    description: "Моделирование контуров опасной бритвой, распаривание горячим компрессом с эфирными маслами, уход за кожей и укладка бальзамом.",
    duration: "45 мин",
    price: "1 500 ₽",
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    number: "03",
    name: "Королевское бритье",
    category: "Traditional Shave",
    description: "Ритуал традиционного бритья: двойное распаривание полотенцем, массаж лица, бритье клинковой бритвой и охлаждающий одеколон.",
    duration: "45 мин",
    price: "2 000 ₽",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    number: "04",
    name: "Премиум Комплекс",
    category: "Full Experience",
    description: "Полное преображение: фирменная стрижка + моделирование бороды с распариванием, уход за кожей лица и массаж шейно-воротниковой зоны.",
    duration: "90 мин",
    price: "3 500 ₽",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 5,
    number: "05",
    name: "Детская стрижка",
    category: "Kids Cut",
    description: "Профессиональная стрижка для детей в комфортной атмосфере. Мастер найдёт подход к каждому ребёнку и создаст аккуратный современный образ.",
    duration: "30 мин",
    price: "1 200 ₽",
    image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 6,
    number: "06",
    name: "Уход за кожей лица",
    category: "Skin Care",
    description: "Глубокое очищение пор, нанесение питательных масок и серум. Кожа станет здоровой, увлажнённой и сияющей после профессионального ухода.",
    duration: "50 мин",
    price: "2 200 ₽",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 7,
    number: "07",
    name: "Камуфляж седины",
    category: "Color & Tone",
    description: "Профессиональное тонирование бороды и висков натуральными красителями. Естественный результат, который держится до 4 недель.",
    duration: "40 мин",
    price: "1 800 ₽",
    image: "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 8,
    number: "08",
    name: "VIP На выезд",
    category: "Premium Home",
    description: "Мастер приедет к вам домой или в офис. Весь инструмент профессионально стерилизован. Доступно в пределах города в любое удобное время.",
    duration: "90 мин",
    price: "5 000 ₽",
    image: "https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?q=80&w=2000&auto=format&fit=crop",
  },
];

const barbers = [
  { id: 1, name: "Александр", role: "Art Director", experience: "8 лет опыта", image: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=600&auto=format&fit=crop" },
  { id: 2, name: "Михаил", role: "Senior Barber", experience: "5 лет опыта", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop" },
  { id: 3, name: "Дмитрий", role: "Top Master", experience: "6 лет опыта", image: "https://images.unsplash.com/photo-1605405748313-a416a1b84491?q=80&w=600&auto=format&fit=crop" },
];

// Утилита для разбиения текста на строки для доступной анимации
const SplitLines = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <span aria-label={text.replace(/\n/g, ' ')} className="block">
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-1" aria-hidden="true">
          <span className="block transform translate-y-full opacity-0 headline-line">{line}</span>
        </span>
      ))}
    </span>
  );
};

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const servicesPinRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Hero headline reveal
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.to(".headline-line", {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.12,
        delay: 0.1,
      });
      tl.fromTo(
        ".hero-fade-in",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
        "-=0.7"
      );

      // 2. Hero zoom & expand on scroll
      if (heroRef.current && heroMediaRef.current) {
        gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "+=100%",
            pin: true,
            scrub: true,
            anticipatePin: 1,
          },
        })
          .to(heroMediaRef.current, {
            scale: 1.15,
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
          }, 0)
          .to(".hero-content-fade", {
            opacity: 0,
            yPercent: -40,
            ease: "none",
          }, 0);
      }

      // 3. Pinned Services Stacking Panels — каждая карточка заезжает снизу при скролле
      if (servicesPinRef.current) {
        const cards = gsap.utils.toArray<HTMLElement>(".service-slide");

        if (cards.length > 1) {
          // Все карточки кроме первой стартуют снизу
          gsap.set(cards.slice(1), { yPercent: 100 });

          // Кол-во переходов = cards.length - 1
          // Каждый переход занимает ровно 1 единицу времени
          // Итого timeline длиной (cards.length - 1)
          const totalSteps = cards.length - 1;

          const serviceTl = gsap.timeline({
            scrollTrigger: {
              trigger: servicesPinRef.current,
              start: "top top",
              // На каждый переход — одна высота вьюпорта скролла
              end: () => `+=${window.innerHeight * totalSteps}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          cards.forEach((card, index) => {
            if (index === 0) return;

            const step = index - 1; // числовая позиция в timeline: 0, 1, 2…
            const prevCard = cards[index - 1];
            const prevInner = prevCard.querySelector(".service-slide-inner");
            const prevShade = prevCard.querySelector(".service-slide-shade");
            const currentContent = card.querySelector(".service-slide-content");

            // Новая карточка въезжает снизу
            serviceTl.to(card, {
              yPercent: 0,
              duration: 1,
              ease: "none",
            }, step);

            // Предыдущая сжимается и темнеет одновременно
            if (prevInner) {
              serviceTl.to(prevInner, {
                scale: 0.92,
                clipPath: "inset(5% 4% 5% 4% round 24px)",
                duration: 1,
                ease: "none",
              }, step);
            }

            if (prevShade) {
              serviceTl.to(prevShade, {
                opacity: 0.65,
                duration: 1,
                ease: "none",
              }, step);
            }

            // Контент новой карточки появляется чуть позже въезда
            if (currentContent) {
              serviceTl.fromTo(currentContent,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
                step + 0.5   // вторая половина перехода
              );
            }
          });
        }
      }

    }); // end mm.add

  }, { scope: container });

  return (
    <div ref={container} className="flex flex-col min-h-screen bg-dark-bg text-dark-text overflow-hidden selection:bg-brand selection:text-dark-bg">
      
      {/* Background ambient gradient */}
      <div 
        className="fixed inset-0 z-[-1] opacity-25 pointer-events-none mix-blend-screen"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(212, 175, 55, 0.12) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(80px)"
        }}
      />

      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand text-dark-bg rounded-lg flex items-center justify-center font-black text-xl tracking-tighter group-hover:scale-105 transition-transform">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.25em] text-white uppercase group-hover:text-brand transition-colors">BARBERSHOP</span>
              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Elegance & Craft</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-white/70 font-medium">
              <a href="#services" className="hover:text-brand transition-colors">Услуги</a>
              <a href="#barbers" className="hover:text-brand transition-colors">Мастера</a>
            </nav>
            <Link 
              href="/book" 
              className="px-6 py-2.5 bg-brand text-dark-bg font-bold text-sm tracking-wider uppercase rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              Записаться
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section (Pinned Zoom with Video) */}
      <section ref={heroRef} className="relative h-screen w-full flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Video Frame */}
        <div 
          ref={heroMediaRef} 
          className="absolute inset-0 z-0 will-change-transform"
          style={{ clipPath: "inset(14% 8% 14% 8% round 24px)" }}
        >
          <div className="absolute inset-0 bg-black/50 z-10" />
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 scale-105"
            src="/Fire Barber Shop Promo - ATLMDERON.mp4"
          />
        </div>

        {/* Hero Content */}
        <div className="hero-content-fade relative z-20 text-center w-full max-w-5xl">
          <div className="hero-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-brand text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Premium Men&apos;s Grooming
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-black leading-[0.85] tracking-tight uppercase text-white mb-6">
            <SplitLines text={"Brutal\nElegance."} />
          </h1>

          <p className="hero-fade-in text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Искусство классического ухода и персональный стиль. Бескомпромиссное качество, созданное для тех, кто ценит совершенство в деталях.
          </p>

          <div className="hero-fade-in flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/book" 
              className="w-full sm:w-auto px-10 py-4 bg-white text-black font-bold tracking-widest uppercase hover:bg-brand hover:text-black transition-all duration-300 rounded-full text-sm shadow-xl"
            >
              Выбрать время
            </Link>
            <a 
              href="#services" 
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium tracking-widest uppercase hover:bg-white/10 transition-colors rounded-full text-sm"
            >
              Смотреть услуги &darr;
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-fade-in absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 text-xs tracking-widest uppercase">
          <span>Скролл</span>
          <div className="w-4 h-7 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-brand rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. Pinned Stacked Services Showcase (Seamless full-screen transitions) */}
      <section 
        id="services" 
        ref={servicesPinRef} 
        className="relative h-screen w-full overflow-hidden bg-black"
      >
        {/* Top Section Badge */}
        <div className="absolute top-24 left-6 md:left-12 z-30 pointer-events-none flex items-center gap-3">
          <span className="w-3 h-[1px] bg-brand" />
          <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">Наши Услуги</span>
        </div>

        {/* Stack of Cards */}
        {services.map((service, index) => (
          <div
            key={service.id}
            className="service-slide absolute inset-0 w-full h-full will-change-transform"
            style={{ zIndex: index + 10 }}
          >
            {/* Inner container with scale & clipPath for the receding effect */}
            <div 
              className="service-slide-inner relative w-full h-full overflow-hidden bg-zinc-950 will-change-transform"
              style={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
            >
              {/* Background Photo */}
              <Image
                src={service.image}
                alt={service.name}
                fill
                priority={index === 0}
                className="object-cover grayscale brightness-60 scale-100"
                sizes="100vw"
              />

              {/* Gradient overlays for contrast & legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

              {/* Dimming Shade during exit */}
              <div className="service-slide-shade absolute inset-0 bg-black opacity-0 pointer-events-none transition-opacity duration-300" />

              {/* Slide Content */}
              <div className="service-slide-content relative z-20 h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-16 md:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                  {/* Left Column: Title & Description */}
                  <div className="lg:col-span-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-brand text-sm font-bold tracking-[0.3em] uppercase">
                        {service.number} / {String(services.length).padStart(2, '0')}
                      </span>
                      <span className="text-white/40 text-xs uppercase tracking-widest">
                        — {service.category}
                      </span>
                    </div>

                    <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight uppercase mb-6">
                      {service.name}
                    </h2>

                    <p className="text-white/80 text-base md:text-xl max-w-2xl leading-relaxed font-light mb-8">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-6">
                      <Link
                        href="/book"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-brand text-dark-bg font-bold tracking-widest uppercase hover:bg-white transition-all duration-300 rounded-full text-xs shadow-lg"
                      >
                        <span>Записаться</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Price & Duration */}
                  <div className="lg:col-span-4 flex lg:flex-col justify-between lg:items-end border-t lg:border-t-0 lg:border-l border-white/15 pt-6 lg:pt-0 lg:pl-10">
                    <div className="text-left lg:text-right">
                      <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Стоимость</div>
                      <div className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white">
                        {service.price}
                      </div>
                    </div>
                    <div className="text-right mt-0 lg:mt-6">
                      <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Длительность</div>
                      <div className="text-lg md:text-xl font-medium tracking-wider text-brand">
                        {service.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Step Progress Dots */}
              <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-3">
                {services.map((s, dotIndex) => (
                  <div
                    key={s.id}
                    className={`w-1.5 transition-all duration-500 rounded-full ${
                      dotIndex === index ? "h-8 bg-brand" : "h-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Masters / Barbers Section */}
      <section id="barbers" className="relative py-32 bg-dark-bg px-6 border-t border-white/10 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-white/10 pb-8 gap-4">
            <div>
              <div className="text-brand text-xs font-bold tracking-[0.3em] uppercase mb-2">Команда</div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
                Мастера
              </h2>
            </div>
            <Link 
              href="/book" 
              className="text-brand hover:text-white uppercase tracking-widest text-xs font-bold transition-colors inline-flex items-center gap-2"
            >
              <span>Выбрать мастера</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {barbers.map((barber) => (
              <div key={barber.id} className="group relative">
                <div className="aspect-[3/4] relative overflow-hidden rounded-2xl mb-6 bg-zinc-900 border border-white/5">
                  <Image 
                    src={barber.image} 
                    alt={barber.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] uppercase tracking-wider text-brand font-semibold mb-2 border border-white/10">
                      {barber.role}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-brand transition-colors">
                  {barber.name}
                </h3>
                <p className="text-white/40 tracking-wider text-sm font-medium">
                  {barber.experience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-black py-20 px-6 border-t border-white/5 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-brand text-dark-bg rounded-xl flex items-center justify-center font-black text-2xl mb-6">
            B
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white/10 uppercase mb-10 select-none">
            BARBERSHOP.
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-white/50 uppercase tracking-widest text-xs font-semibold mb-12">
            <Link href="/book" className="hover:text-brand transition-colors">Онлайн-запись</Link>
            <a href="#services" className="hover:text-brand transition-colors">Услуги и цены</a>
            <a href="#barbers" className="hover:text-brand transition-colors">Наши мастера</a>
          </div>
          <p className="text-white/30 text-xs tracking-wider">
            &copy; {new Date().getFullYear()} BARBERSHOP. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
