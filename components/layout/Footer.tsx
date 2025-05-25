export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">About TariffAlert.me</h3>
            <p className="text-gray-400">
              Stay informed about global tariff changes and trade policies affecting your business.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/products" className="text-gray-400 hover:text-white">Products</a></li>
              <li><a href="/countries" className="text-gray-400 hover:text-white">Countries</a></li>
              <li><a href="/news" className="text-gray-400 hover:text-white">Latest News</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/faq" className="text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="mailto:tariffalert.me@gmail.com" className="text-gray-400 hover:text-white">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              <li><a href="/commissions-and-advertising-disclosures" className="text-gray-400 hover:text-white">Commissions And Advertising Disclosures</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} TariffAlert.me. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 