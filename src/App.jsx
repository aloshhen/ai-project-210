import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SafeIcon component - uses Lucide icons dynamically
const SafeIcon = ({ name, size = 24, className, color }: { name: string; size?: number; className?: string; color?: string }) => {
  const [IconComponent, setIconComponent] = useState<any>(null)
  
  useEffect(() => {
    import('lucide-react').then((icons) => {
      const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
      const Icon = icons[iconName as keyof typeof icons] || icons.HelpCircle
      setIconComponent(() => Icon)
    })
  }, [name])
  
  if (!IconComponent) return <div style={{ width: size, height: size }} className={className} />
  
  return <IconComponent size={size} className={className} color={color} />
}

// Web3Forms Hook
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent, accessKey: string) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    
    const formData = new FormData(e.target as HTMLFormElement)
    formData.append('access_key', accessKey)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        ;(e.target as HTMLFormElement).reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Something went wrong')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }
  
  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// Map Component
const CleanMap = ({ coordinates = [14.4378, 50.0755], zoom = 14, markers = [] }: { coordinates?: number[]; zoom?: number; markers?: any[] }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: #DC2626;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      cursor: pointer;
    `
    
    new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong style="color: #0A0A0A;">BAZA Barbershop</strong><br/><span style="color: #666;">Václavské náměstí 1, Praha</span>'))
      .addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom, markers])

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
      <style>{`
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .maplibregl-compact { display: none !important; }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// FAQ Data
const FAQ_DATA = [
  {
    question: 'Нужно ли записываться заранее?',
    answer: 'Мы рекомендуем записываться заранее через нашу онлайн-форму или по телефону. Также принимаем walk-in клиентов при наличии свободных мест.',
    keywords: ['запись', 'записаться', 'предварительно', 'ждать']
  },
  {
    question: 'Какие способы оплаты вы принимаете?',
    answer: 'Мы принимаем наличные, карты Visa/Mastercard, Apple Pay, Google Pay и оплату через нашу систему лояльности в приложении.',
    keywords: ['оплата', 'карта', 'наличные', 'платеж']
  },
  {
    question: 'Есть ли парковка рядом?',
    answer: 'Да, рядом с барбершопом есть платная парковка на Václavském náměstí. Ближайшая станция метра - Můstek (линии A и B).',
    keywords: ['парковка', 'машина', 'приехать', 'метро']
  },
  {
    question: 'Как работает система лояльности?',
    answer: 'За каждую стрижку вы получаете баллы. Накопив 100 баллов, вы получаете скидку 20% на следующее посещение или бесплатную услугу на выбор.',
    keywords: ['лояльность', 'скидка', 'баллы', 'программа', 'бонусы']
  }
]

const SITE_CONTEXT = 'BAZA Barbershop - премиум барбершоп в центре Праги. Предлагаем стрижки, бритьё, уход за бородой и усами. Работаем с 2019 года. Адрес: Václavské náměstí 1, Praha 1. Телефон: +420 777 888 999. Часы работы: Пн-Пт 9:00-21:00, Сб-Вс 10:00-20:00.'

// Chat Widget
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ type: 'bot', text: 'Привет! Я помогу ответить на ваши вопросы о BAZA Barbershop. Что вас интересует?' }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInput('')
    setIsLoading(true)

    // Check FAQ
    const lowerInput = userMessage.toLowerCase()
    const faqMatch = FAQ_DATA.find(faq => 
      faq.keywords.some(keyword => lowerInput.includes(keyword))
    )

    if (faqMatch) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: faqMatch.answer }])
        setIsLoading(false)
      }, 500)
    } else {
      // Call API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, context: SITE_CONTEXT })
        })
        const data = await response.json()
        setMessages(prev => [...prev, { type: 'bot', text: data.reply || 'Извините, я не понял вопрос. Попробуйте спросить о записи, ценах или нашей программе лояльности.' }])
      } catch (error) {
        setMessages(prev => [...prev, { type: 'bot', text: 'Извините, сервис временно недоступен. Позвоните нам: +420 777 888 999' }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl w-80 sm:w-96 mb-4 shadow-2xl overflow-hidden"
          >
            <div className="bg-red-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SafeIcon name="bot" className="text-white" size={24} />
                <span className="font-bold text-white">BAZA Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <SafeIcon name="x" size={20} />
              </button>
            </div>
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-baza-black">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.type === 'user' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-3 rounded-xl flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
              <button 
                onClick={handleSend}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              >
                <SafeIcon name="send" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2"
      >
        {isOpen ? <SafeIcon name="x" size={24} /> : <SafeIcon name="message-square" size={24} />}
      </motion.button>
    </div>
  )
}

// Main App
function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [bookingService, setBookingService] = useState('')
  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY' // Replace with your Web3Forms Access Key

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const services = [
    { name: 'Стрижка мужская', price: '600 Kč', time: '45 мин', icon: 'scissors' },
    { name: 'Стрижка + борода', price: '900 Kč', time: '60 мин', icon: 'crown' },
    { name: 'Королевское бритьё', price: '500 Kč', time: '30 мин', icon: 'sparkles' },
    { name: 'Уход за бородой', price: '400 Kč', time: '20 мин', icon: 'hand' },
    { name: 'Детская стрижка', price: '450 Kč', time: '30 мин', icon: 'smile' },
    { name: 'Оформление усов', price: '200 Kč', time: '15 мин', icon: 'mustache' },
  ]

  const portfolio = [
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
    'https://images.unsplash.com/photo-1599351431202-0e671340044d?w=600&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
    'https://images.unsplash.com/photo-1593702295094-aea13ccadd1e?w=600&q=80',
  ]

  const reviews = [
    { name: 'Александр', text: 'Лучший барбершоп в Праге! Атмосфера, сервис и результат на высоте.', rating: 5 },
    { name: 'Михаил', text: 'Хожу сюда уже 2 года. Мастера настоящие профессионалы.', rating: 5 },
    { name: 'Иван', text: 'Отличная система лояльности. Уже получил две бесплатные стрижки!', rating: 5 },
    { name: 'Петр', text: 'Премиальный сервис за разумные деньги. Рекомендую!', rating: 5 },
  ]

  const blogPosts = [
    { title: 'Как выбрать стрижку под тип лица', date: '15 янв 2024', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80' },
    { title: 'Уход за бородой зимой: 5 советов', date: '10 янв 2024', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80' },
    { title: 'Тренды мужских стрижек 2024', date: '5 янв 2024', image: 'https://images.unsplash.com/photo-1599351431202-0e671340044d?w=400&q=80' },
  ]

  return (
    <div className="min-h-screen bg-baza-black text-white overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 w-full bg-baza-black/90 backdrop-blur-xl z-50 border-b border-gray-800">
        <nav className="container mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <SafeIcon name="scissors" className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">BAZA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['О нас', 'Услуги', 'Портфолио', 'Цены', 'Блог', 'FAQ', 'Контакты'].map((item, idx) => {
              const ids = ['about', 'services', 'portfolio', 'prices', 'blog', 'faq', 'contact']
              return (
                <button 
                  key={item} 
                  onClick={() => scrollToSection(ids[idx])}
                  className="text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  {item}
                </button>
              )
            })}
          </div>

          <button 
            onClick={() => scrollToSection('booking')}
            className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105 items-center gap-2"
          >
            <SafeIcon name="calendar" size={18} />
            Записаться
          </button>

          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <SafeIcon name={mobileMenuOpen ? "x" : "menu"} size={28} />
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-baza-gray border-b border-gray-800"
            >
              <div className="px-4 py-4 space-y-3">
                {['О нас', 'Услуги', 'Портфолио', 'Цены', 'Блог', 'FAQ', 'Контакты'].map((item, idx) => {
                  const ids = ['about', 'services', 'portfolio', 'prices', 'blog', 'faq', 'contact']
                  return (
                    <button 
                      key={item} 
                      onClick={() => scrollToSection(ids[idx])}
                      className="block w-full text-left text-gray-400 hover:text-red-500 py-2 font-medium"
                    >
                      {item}
                    </button>
                  )
                })}
                <button 
                  onClick={() => scrollToSection('booking')}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-full font-bold mt-4"
                >
                  Записаться онлайн
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80" 
            alt="Barbershop interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-baza-black/80 via-baza-black/60 to-baza-black" />
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <SafeIcon name="map-pin" className="text-red-500" size={16} />
              <span className="text-sm font-medium">Václavské náměstí 1, Praha 1</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter">
              <span className="text-white">BAZA</span>
              <span className="text-red-600">.</span>
              <br />
              <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-400">Barbershop Prague</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Премиальные стрижки и бритьё в сердце Праги. 
              Где стиль встречается с традициями.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('booking')}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-600/30"
              >
                <SafeIcon name="calendar" size={20} />
                Записаться сейчас
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('portfolio')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2"
              >
                <SafeIcon name="play" size={20} />
                Смотреть работы
              </motion.button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <SafeIcon name="clock" className="text-red-500" size={20} />
                <span>Пн-Пт: 9:00-21:00</span>
              </div>
              <div className="flex items-center gap-2">
                <SafeIcon name="phone" className="text-red-500" size={20} />
                <span>+420 777 888 999</span>
              </div>
              <div className="flex items-center gap-2">
                <SafeIcon name="star" className="text-red-500" size={20} />
                <span>4.9/5 (328 отзывов)</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-baza-black to-transparent" />
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32 bg-baza-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
                <SafeIcon name="info" size={20} />
                <span>О НАС</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Барбершоп с душой <span className="text-red-600">в центре Праги</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                BAZA Barbershop — это место, где традиции классического барберинга встречаются с современными трендами. 
                С 2019 года мы создаём стиль для мужчин, которые ценят качество и внимание к деталям.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Наши мастера — профессионалы с опытом работы более 5 лет. 
                Мы используем только премиальную косметику и инструменты.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-red-600 mb-1">5+</div>
                  <div className="text-gray-500 text-sm">Лет опыта</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-red-600 mb-1">10k+</div>
                  <div className="text-gray-500 text-sm">Клиентов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-red-600 mb-1">6</div>
                  <div className="text-gray-500 text-sm">Мастеров</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80" 
                  alt="Barber at work" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-baza-black/50 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-red-600 rounded-2xl p-6 shadow-2xl hidden md:block">
                <div className="flex items-center gap-3">
                  <SafeIcon name="award" className="text-white" size={32} />
                  <div>
                    <div className="text-white font-bold">Топ-3</div>
                    <div className="text-white/80 text-sm">Барбершоп Праги</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-baza-gray">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="sparkles" size={20} />
              <span>УСЛУГИ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Наши <span className="text-red-600">услуги</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-baza-black border border-gray-800 rounded-2xl p-6 hover:border-red-600/50 transition-all group cursor-pointer"
                onClick={() => {
                  setBookingService(service.name)
                  scrollToSection('booking')
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                    <SafeIcon name={service.icon} className="text-red-500" size={28} />
                  </div>
                  <span className="text-2xl font-black text-red-600">{service.price}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <SafeIcon name="clock" size={14} />
                  <span>{service.time}</span>
                </div>
                <button className="w-full bg-gray-800 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:bg-red-600">
                  <SafeIcon name="calendar" size={18} />
                  Записаться
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 md:py-32 bg-baza-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="image" size={20} />
              <span>ПОРТФОЛИО</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Наши <span className="text-red-600">работы</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolio.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative group overflow-hidden rounded-2xl aspect-square cursor-pointer"
              >
                <img 
                  src={img} 
                  alt={`Work ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/80 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <SafeIcon name="zoom-in" className="text-white" size={40} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 font-bold text-lg transition-colors"
            >
              <SafeIcon name="instagram" size={24} />
              Смотреть больше в Instagram
              <SafeIcon name="arrow-right" size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Prices Section */}
      <section id="prices" className="py-20 md:py-32 bg-baza-gray">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="credit-card" size={20} />
              <span>ЦЕНЫ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Прайс-лист <span className="text-red-600">услуг</span>
            </h2>
          </div>

          <div className="bg-baza-black rounded-3xl p-6 md:p-10 border border-gray-800">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0 hover:bg-gray-900/50 px-4 -mx-4 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <SafeIcon name={service.icon} className="text-red-500" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <span className="text-gray-500 text-sm">{service.time}</span>
                  </div>
                </div>
                <span className="text-xl font-black text-red-600">{service.price}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-gray-500">
            * Все цены указаны с учётом НДС. Оплата возможна наличными или картой.
          </div>
        </div>
      </section>

      {/* Loyalty Section */}
      <section className="py-20 md:py-32 bg-baza-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
                <SafeIcon name="gift" size={20} />
                <span>СИСТЕМА ЛОЯЛЬНОСТИ</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Больше посещений — <span className="text-red-600">больше бонусов</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Получайте баллы за каждое посещение. Накапливайте и обменивайте их на бесплатные услуги и скидки.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <SafeIcon name="check-circle" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="font-bold">1 балл = 1 Kč</div>
                    <div className="text-gray-500 text-sm">Начисляем 10% от суммы чека</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <SafeIcon name="percent" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="font-bold">Скидка 20%</div>
                    <div className="text-gray-500 text-sm">При накоплении 100 баллов</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <SafeIcon name="crown" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="font-bold">Бесплатная стрижка</div>
                    <div className="text-gray-500 text-sm">При накоплении 500 баллов</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-red-200 text-sm font-medium mb-1">ВАША КАРТА</div>
                    <div className="text-2xl font-black">BAZA VIP</div>
                  </div>
                  <SafeIcon name="crown" size={40} className="text-red-200" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                  <div className="text-red-200 text-sm mb-1">ТЕКУЩИЙ БАЛАНС</div>
                  <div className="text-4xl font-black">245 баллов</div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-red-200 text-xs">Визитов</div>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">4.9</div>
                    <div className="text-red-200 text-xs">Рейтинг</div>
                  </div>
                </div>
                <div className="mt-6 text-center text-red-200 text-sm">
                  Покажите QR-код мастеру при оплате
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 md:py-32 bg-baza-gray">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="star" size={20} />
              <span>ОТЗЫВЫ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Что говорят <span className="text-red-600">клиенты</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-baza-black border border-gray-800 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <SafeIcon key={i} name="star" className="text-yellow-500 fill-yellow-500" size={16} />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <SafeIcon name="user" className="text-red-500" size={20} />
                  </div>
                  <span className="font-bold">{review.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 md:py-32 bg-baza-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="newspaper" size={20} />
              <span>БЛОГ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Полезные <span className="text-red-600">статьи</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/3]">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-baza-black/60 to-transparent" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <SafeIcon name="calendar" size={14} />
                  <span>{post.date}</span>
                </div>
                <h3 className="text-xl font-bold group-hover:text-red-500 transition-colors">
                  {post.title}
                </h3>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-baza-gray">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="help-circle" size={20} />
              <span>FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Частые <span className="text-red-600">вопросы</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_DATA.map((faq, idx) => (
              <div key={idx} className="bg-baza-black rounded-2xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-lg pr-4">{faq.question}</span>
                  <SafeIcon 
                    name={activeFaq === idx ? "minus" : "plus"} 
                    className="text-red-500 shrink-0" 
                    size={24} 
                  />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-400">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-20 md:py-32 bg-baza-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent" />
        <div className="container mx-auto max-w-4xl px-4 md:px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="calendar" size={20} />
              <span>ОНЛАЙН-ЗАПИСЬ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Запишитесь <span className="text-red-600">онлайн</span>
            </h2>
            <p className="text-gray-400 mt-4">Выберите услугу и удобное время. Мы подтвердим запись в течение 15 минут.</p>
          </div>

          <div className="bg-baza-gray rounded-3xl p-6 md:p-10 border border-gray-800">
            {!isSuccess ? (
              <form onSubmit={(e) => handleSubmit(e, ACCESS_KEY)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ваше имя</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Иван Иванов"
                      className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Телефон</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+420 777 888 999"
                      className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Выберите услугу</label>
                  <select
                    name="service"
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="">Выберите услугу...</option>
                    {services.map((service, idx) => (
                      <option key={idx} value={service.name}>
                        {service.name} — {service.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Дата</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Время</label>
                    <select
                      name="time"
                      required
                      className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                    >
                      <option value="">Выберите время...</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                      <option value="20:00">20:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Комментарий (необязательно)</label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Особые пожелания..."
                    className="w-full px-4 py-3 bg-baza-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>

                {isError && (
                  <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-xl">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <SafeIcon name="calendar-check" size={20} />
                      Подтвердить запись
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SafeIcon name="check-circle" className="text-green-500" size={48} />
                </div>
                <h3 className="text-3xl font-bold mb-4">Запись отправлена!</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Мы получили вашу заявку и свяжемся с вами в течение 15 минут для подтверждения.
                </p>
                <button
                  onClick={resetForm}
                  className="text-red-500 hover:text-red-400 font-semibold"
                >
                  Записаться ещё
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section with Map */}
      <section id="contact" className="py-20 md:py-32 bg-baza-gray">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-red-500 font-bold mb-4">
              <SafeIcon name="map-pin" size={20} />
              <span>КОНТАКТЫ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Приходите к <span className="text-red-600">нам</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-baza-black rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                    <SafeIcon name="map-pin" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Адрес</div>
                    <div className="font-bold">Václavské náměstí 1, Praha 1</div>
                    <div className="text-gray-500 text-sm">110 00, Czech Republic</div>
                  </div>
                </div>
              </div>

              <div className="bg-baza-black rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                    <SafeIcon name="clock" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Часы работы</div>
                    <div className="font-bold">Пн-Пт: 9:00 — 21:00</div>
                    <div className="font-bold">Сб-Вс: 10:00 — 20:00</div>
                  </div>
                </div>
              </div>

              <div className="bg-baza-black rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                    <SafeIcon name="phone" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Телефон</div>
                    <div className="font-bold">+420 777 888 999</div>
                    <div className="text-gray-500 text-sm">WhatsApp, Telegram</div>
                  </div>
                </div>
              </div>

              <div className="bg-baza-black rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                    <SafeIcon name="mail" className="text-red-500" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Email</div>
                    <div className="font-bold">info@bazabarbershop.cz</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-baza-black hover:bg-red-600 border border-gray-800 hover:border-red-600 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                >
                  <SafeIcon name="instagram" className="group-hover:text-white" size={24} />
                  <span className="hidden sm:inline">Instagram</span>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-baza-black hover:bg-red-600 border border-gray-800 hover:border-red-600 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                >
                  <SafeIcon name="facebook" className="group-hover:text-white" size={24} />
                  <span className="hidden sm:inline">Facebook</span>
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-baza-black hover:bg-red-600 border border-gray-800 hover:border-red-600 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group"
                >
                  <SafeIcon name="youtube" className="group-hover:text-white" size={24} />
                  <span className="hidden sm:inline">YouTube</span>
                </a>
              </div>
            </div>

            <div className="h-[400px] lg:h-auto min-h-[400px]">
              <CleanMap coordinates={[14.4378, 50.0755]} zoom={15} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-baza-black border-t border-gray-800 py-12 telegram-safe-bottom">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <SafeIcon name="scissors" className="text-white" size={18} />
                </div>
                <span className="text-xl font-black">BAZA</span>
              </div>
              <p className="text-gray-500 text-sm">
                Премиум барбершоп в центре Праги. Стильные стрижки и бритьё с 2019 года.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Услуги</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-red-500 transition-colors">Мужские стрижки</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-red-500 transition-colors">Бритьё</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-red-500 transition-colors">Уход за бородой</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-red-500 transition-colors">Королевское бритьё</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Информация</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-red-500 transition-colors">О нас</button></li>
                <li><button onClick={() => scrollToSection('prices')} className="hover:text-red-500 transition-colors">Цены</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-red-500 transition-colors">Блог</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-red-500 transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>Václavské náměstí 1, Praha 1</li>
                <li>+420 777 888 999</li>
                <li>info@bazabarbershop.cz</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 text-sm">
              © 2024 BAZA Barbershop. All rights reserved.
            </div>
            <div className="flex gap-6 text-gray-600 text-sm">
              <button className="hover:text-red-500 transition-colors">Privacy Policy</button>
              <button className="hover:text-red-500 transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default App