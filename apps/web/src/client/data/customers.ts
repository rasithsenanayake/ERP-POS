export interface CustomerSeed {
  name: string;
  phone: string;
  city: string;
  branchId: string;
  tags: string[];
  company?: string;
}

export const customerSeeds: CustomerSeed[] = [
{ name: 'Ashan Wijesinghe', phone: '077 412 8890', city: 'Colombo 05', branchId: 'br-col', tags: ['VIP'] },
{ name: 'Dinusha Abeysekera', phone: '071 553 2041', city: 'Colombo 07', branchId: 'br-col', tags: ['VIP'] },
{ name: 'Mohamed Rizwan', phone: '077 830 1126', city: 'Dehiwala', branchId: 'br-col', tags: [] },
{ name: 'Priyanka Rajapaksha', phone: '076 221 9083', city: 'Nugegoda', branchId: 'br-col', tags: [] },
{ name: 'Shehan de Silva', phone: '077 908 4412', city: 'Rajagiriya', branchId: 'br-col', tags: ['Returning'] },
{ name: 'Fathima Nuzra', phone: '075 318 7720', city: 'Wellawatte', branchId: 'br-col', tags: [] },
{ name: 'Kavinda Senanayake', phone: '071 662 0398', city: 'Battaramulla', branchId: 'br-col', tags: [] },
{ name: 'Anushka Gunawardena', phone: '077 145 6631', city: 'Colombo 03', branchId: 'br-col', tags: ['VIP'] },
{ name: 'Rajiv Thurairajah', phone: '077 776 2210', city: 'Colombo 06', branchId: 'br-col', tags: [] },
{ name: 'Hiruni Amarasinghe', phone: '070 284 5519', city: 'Kotte', branchId: 'br-col', tags: [] },
{ name: 'Lakshan Perera', phone: '077 300 4410', city: 'Colombo 02', branchId: 'br-col', tags: ['Corporate'], company: 'Bayview Tech Solutions (Pvt) Ltd' },
{ name: 'Nadeesha Herath', phone: '076 509 1180', city: 'Colombo 04', branchId: 'br-col', tags: ['Corporate'], company: 'Lakeside Consulting (Pvt) Ltd' },
{ name: 'Imran Cassim', phone: '077 691 3307', city: 'Colombo 11', branchId: 'br-col', tags: ['Wholesale'], company: 'Pettah Mobile Mart' },
{ name: 'Chamara Bandara', phone: '071 845 2296', city: 'Maharagama', branchId: 'br-col', tags: ['Wholesale'], company: 'Metro Gadget Hub' },
{ name: 'Sanduni Karunaratne', phone: '077 230 7754', city: 'Mount Lavinia', branchId: 'br-col', tags: [] },
{ name: 'Thilina Weerasinghe', phone: '078 455 0912', city: 'Kiribathgoda', branchId: 'br-col', tags: [] },
{ name: 'Gayani Jayasuriya', phone: '077 963 5081', city: 'Colombo 08', branchId: 'br-col', tags: ['VIP'] },
{ name: 'Arjun Sivakumar', phone: '076 732 4418', city: 'Wattala', branchId: 'br-col', tags: [] },
{ name: 'Malsha Dissanayake', phone: '071 409 6627', city: 'Piliyandala', branchId: 'br-col', tags: [] },
{ name: 'Ruvin Fonseka', phone: '077 518 3349', city: 'Moratuwa', branchId: 'br-col', tags: ['Returning'] },
{ name: 'Shanika Ekanayake', phone: '077 622 8814', city: 'Colombo 01', branchId: 'br-col', tags: ['Corporate'], company: 'Harbourline Logistics' },
{ name: 'Yohan Van Langenberg', phone: '077 384 1195', city: 'Colombo 05', branchId: 'br-col', tags: [] },
{ name: 'Nirasha Liyanage', phone: '075 671 2203', city: 'Kelaniya', branchId: 'br-col', tags: [] },
{ name: 'Dulaj Ratnayake', phone: '077 157 9946', city: 'Homagama', branchId: 'br-col', tags: [] },
{ name: 'Zainab Marikar', phone: '077 802 6670', city: 'Colombo 10', branchId: 'br-col', tags: [] },
{ name: 'Sampath Ranasinghe', phone: '077 691 0042', city: 'Peradeniya', branchId: 'br-kdy', tags: ['VIP'] },
{ name: 'Ishani Wickremaratne', phone: '071 330 5518', city: 'Kandy', branchId: 'br-kdy', tags: [] },
{ name: 'Pradeep Alahakoon', phone: '077 448 2290', city: 'Katugastota', branchId: 'br-kdy', tags: [] },
{ name: 'Nilmini Tennakoon', phone: '076 905 3374', city: 'Kandy', branchId: 'br-kdy', tags: ['Returning'] },
{ name: 'Ravindu Wijeratne', phone: '077 213 6681', city: 'Digana', branchId: 'br-kdy', tags: [] },
{ name: 'Sharmila Yogarajah', phone: '077 587 4426', city: 'Kandy', branchId: 'br-kdy', tags: [] },
{ name: 'Udara Samarakoon', phone: '077 640 1185', city: 'Kandy', branchId: 'br-kdy', tags: ['Corporate'], company: 'Hill Country Hotels (Pvt) Ltd' },
{ name: 'Asela Kumara', phone: '071 778 2059', city: 'Kandy', branchId: 'br-kdy', tags: ['Wholesale'], company: 'Kandy Office Supplies' },
{ name: 'Thisara Rathnayake', phone: '077 902 3317', city: 'Gampola', branchId: 'br-kdy', tags: [] },
{ name: 'Dilini Wanigasekara', phone: '078 336 9940', city: 'Kundasale', branchId: 'br-kdy', tags: [] },
{ name: 'Mohamed Haris', phone: '077 125 6608', city: 'Akurana', branchId: 'br-kdy', tags: [] },
{ name: 'Chathurika Senaratne', phone: '071 864 1172', city: 'Kandy', branchId: 'br-kdy', tags: ['VIP'] },
{ name: 'Janith Abeyratne', phone: '077 359 0026', city: 'Matale', branchId: 'br-kdy', tags: [] },
{ name: 'Kumudini Dharmasena', phone: '076 470 5513', city: 'Kandy', branchId: 'br-kdy', tags: [] },
{ name: 'Lahiru Pathirana', phone: '077 731 8840', city: 'Peradeniya', branchId: 'br-kdy', tags: [] },
{ name: 'Senuri Jayalath', phone: '077 296 4471', city: 'Kandy', branchId: 'br-kdy', tags: [] },
{ name: 'Nuwan Kodikara', phone: '077 563 2208', city: 'Kandy', branchId: 'br-kdy', tags: ['Wholesale'], company: 'Central Hills Traders' },
{ name: 'Sajith Mendis', phone: '071 207 7795', city: 'Kegalle', branchId: 'br-kdy', tags: [] },
{ name: 'Ruwanthi Galappaththi', phone: '077 384 6650', city: 'Galle', branchId: 'br-gal', tags: ['VIP'] },
{ name: 'Niroshan Jayasekara', phone: '077 815 2234', city: 'Unawatuna', branchId: 'br-gal', tags: [] },
{ name: 'Hasini Gamage', phone: '071 642 9971', city: 'Galle', branchId: 'br-gal', tags: [] },
{ name: 'Damith Kariyawasam', phone: '077 509 3318', city: 'Hikkaduwa', branchId: 'br-gal', tags: [] },
{ name: 'Sarah Ondaatje', phone: '077 220 7149', city: 'Galle Fort', branchId: 'br-gal', tags: ['VIP'] },
{ name: 'Asanka Weerakkody', phone: '077 667 0285', city: 'Galle', branchId: 'br-gal', tags: ['Wholesale'], company: 'Southern Star Traders' },
{ name: 'Pavithra Lokuge', phone: '076 318 5562', city: 'Ambalangoda', branchId: 'br-gal', tags: [] },
{ name: 'Charith Hettiarachchi', phone: '077 941 2276', city: 'Matara', branchId: 'br-gal', tags: [] },
{ name: 'Kumari Vithanage', phone: '071 503 8814', city: 'Galle', branchId: 'br-gal', tags: [] },
{ name: 'Tharindu Munasinghe', phone: '077 172 4490', city: 'Weligama', branchId: 'br-gal', tags: ['Returning'] },
{ name: 'Melissa Koelmeyer', phone: '077 655 3302', city: 'Galle Fort', branchId: 'br-gal', tags: [] },
{ name: 'Roshan Hewage', phone: '077 284 9917', city: 'Galle', branchId: 'br-gal', tags: ['Corporate'], company: 'Fort Bay Boutique Hotel' },
{ name: 'Dulani Siriwardena', phone: '078 906 1143', city: 'Galle', branchId: 'br-gal', tags: [] },
{ name: 'Viraj Abeygunawardena', phone: '077 437 5528', city: 'Koggala', branchId: 'br-gal', tags: [] },
{ name: 'Nethmi Rupasinghe', phone: '071 290 6635', city: 'Galle', branchId: 'br-gal', tags: [] },
{ name: 'Kanishka Liyanaarachchi', phone: '077 768 1149', city: 'Baddegama', branchId: 'br-gal', tags: [] },
{ name: 'Ayesha Jaleel', phone: '077 341 7782', city: 'Galle', branchId: 'br-gal', tags: ['High Risk'] }];


export const customerTagOptions = ['VIP', 'Wholesale', 'Corporate', 'Retail', 'Returning', 'High Risk'];