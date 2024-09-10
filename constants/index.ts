export const headerLinks = [
  {
    label: 'Home',
    route: '/',
  },
  {
    label: 'Create Event',
    route: '/events/create',
  },
  {
    label: 'My Profile',
    route: '/profile',
  },
]

export const eventDefaultValues = {
  title: '',
  description: '',
  location: '',
  imageUrl: '',
  startDateTime: new Date(),
  endDateTime: new Date(),
  categoryId: '',
  registrationSuccessMessage: `
    📣 通知
    🪷 已收到您的报名
    👉🏻 当天请在报到处以此以上排队号码登记。

    注：无法参与绕佛的大众，可以坐在不绕佛区。 Those who are unable to participate in the circumambulation session, can sit in the non-circumambulation area.

    ▫▫▫▫▫▫▫▫
    ⧉ 净土宗弥陀寺（新加坡）⧉
    ≡ 27, Lor 27, Geylang, S‘pore 388163 ≡
    ≡ +65-8818 4848 ≡
    Nearby Aljunied Mrt (阿裕尼地铁站附近)
    Google Map：https://goo.gl/maps/9LsNw8fSLmqRD64X6
  `
}
