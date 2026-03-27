export const CATEGORIES = [
  'PG',
  'Hostel',
  'Mess',
  'Tiffin Service',
  'Library',
  'Study Room',
  'Coaching Institute',
  'Coworking Space',
  'Gym',
  'Laundry',
  'Stationery Shop',
  'Wifi Service',
  'Others'
];

export const STATE_CITIES: Record<string, string[]> = {
  'Bihar': [
    'Patna', 'Gaya', 'Nawada', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnea', 'Ara', 'Begusarai', 'Katihar'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Noida', 'Ghaziabad', 'Agra', 'Meerut', 'Bareilly', 'Aligarh'
  ],
  'Delhi': [
    'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Navi Mumbai', 'Thane', 'Kalyan'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi'
  ],
  'West Bengal': [
    'Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur', 'Haldia', 'Midnapore'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'
  ],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'
  ]
};

export const ALL_CITIES = Object.values(STATE_CITIES).flat();
