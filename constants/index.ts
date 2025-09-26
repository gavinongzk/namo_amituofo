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
    👉🏻 当天请在报到处以此二维码点名。/ Please use this QR code to take attendance at the registration counter on the event day.

    注：/ Note:
    ▪ 无法参与绕佛的大众，可以坐在不绕佛区。/ Those who are unable to participate in the circumambulation session can sit in the non-circumambulation area.
    ▪ 衣装整齐，如穿有袖之衣服、长裤等。 / Please wear proper attire and trousers.
    ▪ 如感身体不适🤒，还请在家休养，不便参与。 / If feel uncomfortable, please stay at home and rest.
    ▪ 由于座位有限🪑，先到先坐， 无法提供保留位子。/ No booking seat in advance , first come first serve.

    ▫▫▫▫▫▫▫▫
    ⧉ 净土宗弥陀寺（新加坡）/ Namo Amituofo Organization Ltd⧉
    ≡ 27, Lor 27, Geylang, S'pore 388163 ≡
    ≡ +65-8818 4848 ≡
    阿裕尼地铁站附近 / Near Aljunied MRT
    Google Maps：https://goo.gl/maps/9LsNw8fSLmqRD64X6
  `
}

export const categoryCustomFields = {
  default: [
    { id: '1', label: '名字、皈依名 / Name 、Dharma Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact Number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '念佛共修': [
    { id: '1', label: '名字、皈依名 / Name 、Dharma Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact Number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '念佛超荐法会': [
    { id: '1', label: '名字、皈依名 / Name 、 Dharma Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact Number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '外出结缘法会': [
    { id: '1', label: '义工名字 / Volunteer\'s Name', type: 'text' },
    { id: '2', label: '联系号码 / Contact Number', type: 'phone' },
    { id: '3', label: '邮区编号 / Postal Code', type: 'postal' },
  ],
  '义工招募': [
    { id: '1', label: '名字 / Name', type: 'text' },
    { id: '2', label: '净土宗皈依号 / Pure Land Refuge Number', type: 'text' },
    { id: '3', label: '联系号码 / Contact Number', type: 'phone' },
    { id: '4', label: '是否愿意参与义工服务 / Willing to participate in volunteer service', type: 'radio', options: [
      { label: '是的，我愿意参与 / Yes, I am willing to participate', value: 'yes' },
      { label: '暂时无法参与 / Unable to participate at the moment', value: 'no' }
    ]},
    { id: '5', label: '每月参与次数 / Monthly participation frequency', type: 'radio', options: [
      { label: '每月 2 次 / Twice a month', value: 'twice' },
      { label: '每月 1 次 / Once a month', value: 'once' },
      { label: '其他（请注明）/ Other (please specify)', value: 'other' }
    ]},
    { id: '6', label: '询问事项 / Inquiries', type: 'text' },
  ],
  // Add more categories as needed
};

export type CategoryName = keyof typeof categoryCustomFields;
