import Link from 'next/link';

export function MonasteryContact() {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-gray-800">⧉ 净土宗弥陀寺（新加坡）⧉</h3>
      <p className="text-gray-600">≡ 27, Lor 27, Geylang, S'pore 388163 ≡</p>
      <Link 
        href="https://wa.me/6588184848"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-2"
      >
        <span>≡ WhatsApp: +65-8818 4848 ≡</span>
      </Link>
      <p className="text-gray-600">Nearby Aljunied Mrt (阿裕尼地铁站附近)</p>
      <Link 
        href="https://goo.gl/maps/9LsNw8fSLmqRD64X6"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-700 transition-colors"
      >
        Google Map
      </Link>
    </div>
  );
}
