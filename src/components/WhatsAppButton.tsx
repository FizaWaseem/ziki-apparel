import Image from 'next/image'

export default function WhatsAppButton() {
  const whatsappNumber = '923060622399' // International format: +92 for Pakistan, remove leading 0
  const whatsappLink = `https://wa.me/${whatsappNumber}`

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 bg-white hover:bg-green-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 overflow-hidden"
      title="Chat with us on WhatsApp"
    >
      <Image
        src="/images/whatsapp.svg"
        alt="WhatsApp"
        width={28}
        height={28}
        className="object-contain"
      />
    </a>
  )
}
