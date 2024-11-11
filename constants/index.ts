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
  maxSeats: 300,
  registrationSuccessMessage: `
    📣 通知
    🪷 已收到您的报名
    👉🏻 当天请在报到处以此以上排队号码登记。

    注：无法参与绕佛的大众，可以坐在不绕佛区。 Those who are unable to participate in the circumambulation session, can sit in the non-circumambulation area.

    ▫▫▫▫▫▫▫▫
    ⧉ 净土宗弥陀寺（新加坡）⧉
    ≡ 27, Lor 27, Geylang, S'pore 388163 ≡
    ≡ WhatsApp: <a href="https://wa.me/6588184848">+65-8818 4848</a> ≡
    Nearby Aljunied Mrt (阿裕尼地铁站附近)
    Google Map：https://goo.gl/maps/9LsNw8fSLmqRD64X6
  `
}

export const categoryCustomFields = {
  default: [
    { id: '1', label: '参加者名字 Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 Contact number', type: 'phone' },
  ],
  '念佛共修': [
    { id: '1', label: '参加者名字 Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 Contact number', type: 'phone' },
    {
      id: '3',
      label: '请问要参加绕佛吗？Does the participant want to participate in walking and reciting section?',
      type: 'radio',
      options: [
        { value: 'yes', label: '是 Yes' },
        { value: 'no', label: '否 No' }
      ]
    },
  ],
  '念佛｜闻法｜祈福｜超荐': [
    { id: '1', label: '参加者名字 Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 Contact number', type: 'phone' },
  ],
  '外出结缘法会': [
    { id: '1', label: '义工名字 Volunteer\'s Name', type: 'text' },
    { id: '2', label: '联系号码 Contact number', type: 'phone' },
  ],
  // Add more categories as needed
};

export type CategoryName = keyof typeof categoryCustomFields;
