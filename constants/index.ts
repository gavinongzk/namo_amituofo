export const eventDefaultValues = {
  title: '',
  description: '',
  location: '',
  imageUrl: '',
  startDateTime: new Date(),
  endDateTime: new Date(),
  categoryId: '',
  maxSeats: 300,
  country: 'Singapore',
  registrationSuccessMessage: `
    📣 通知 / Notice
    🪷 已收到您的报名 / Registration Received
    👉🏻 当天请在报到处以此二维码登记。/ Please use this QR code to check in at the registration counter on the event day.

    注：/ Note:
    无法参与绕佛的大众，可以坐在不绕佛区。/ Those who are unable to participate in the circumambulation session can sit in the non-circumambulation area.
    请着装庄重, 以示对阿弥陀佛的恭敬。/ Please dress appropriately to show respect for Amitabha Buddha.

    ▫▫▫▫▫▫▫▫
    ⧉ 净土宗弥陀寺（新加坡）/ Namo Amituofo Organization Ltd⧉
    ≡ 27, Lor 27, Geylang, S'pore 388163 ≡
    ≡ +65-8818 4848 ≡
    阿裕尼地铁站附近 / Nearby Aljunied MRT
    Google Maps：https://goo.gl/maps/9LsNw8fSLmqRD64X6
  `
}

export const categoryCustomFields = {
  default: [
    { id: '1', label: '参加者姓名 / Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '念佛共修': [
    { id: '1', label: '参加者姓名 / Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '念佛超荐法会': [
    { id: '1', label: '参加者姓名 / Participant\'s Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '外出结缘法会': [
    { id: '1', label: '义工姓名 / Volunteer\'s Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  // Add more categories as needed
};

export type CategoryName = keyof typeof categoryCustomFields;
