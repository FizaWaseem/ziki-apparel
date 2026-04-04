import Layout from '@/components/Layout'
import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">About Ziki Apparel</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Premium denim jeans for the modern lifestyle. Quality craftsmanship meets contemporary style.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Founded with a passion for exceptional denim, Ziki Apparel has been crafting premium jeans 
                that combine timeless style with modern comfort. Our journey began with a simple belief: 
                everyone deserves quality clothing that makes them feel confident and comfortable.
              </p>
              <p className="text-gray-700 mb-4">
                We source the finest materials and work with skilled artisans to create jeans that not only 
                look great but also stand the test of time. Each pair is carefully crafted with attention 
                to detail, ensuring the perfect fit and finish.
              </p>
              <p className="text-gray-700">
                Today, Ziki Apparel continues to innovate while staying true to our core values of quality, 
                sustainability, and customer satisfaction.
              </p>
            </div>
            <div className="relative h-96">
              <Image
                src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"
                alt="Ziki Apparel craftsmanship"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-xl text-gray-600">What drives us every day</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌟</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality First</h3>
                <p className="text-gray-600">
                  We never compromise on quality. Every product is made with the finest materials 
                  and crafted to perfection.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainability</h3>
                <p className="text-gray-600">
                  {`We're committed to sustainable practices and reducing our environmental impact 
                  through responsible sourcing and production.`}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❤️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Care</h3>
                <p className="text-gray-600">
                  Your satisfaction is our priority. We provide exceptional service and support 
                  to ensure you love your Ziki Apparel experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">Passionate people behind great products</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
                  alt="Team member"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Alex Johnson</h3>
              <p className="text-gray-600 mb-2">Founder & CEO</p>
              <p className="text-sm text-gray-500">
                Passionate about bringing quality denim to everyone.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200"
                  alt="Team member"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Sarah Chen</h3>
              <p className="text-gray-600 mb-2">Head of Design</p>
              <p className="text-sm text-gray-500">
                Creates designs that blend comfort with contemporary style.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
                  alt="Team member"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Mike Rodriguez</h3>
              <p className="text-gray-600 mb-2">Quality Manager</p>
              <p className="text-sm text-gray-500">
                Ensures every product meets our high-quality standards.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {`Have questions about our products or want to learn more about Ziki Apparel? 
              We'd love to hear from you.`}
            <Link
              href="/contact"
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}