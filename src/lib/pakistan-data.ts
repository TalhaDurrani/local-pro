
export interface PakistanProvince {
  name: string;
  cities: string[];
}

export const PAKISTAN_DATA: PakistanProvince[] = [
  {
    name: "Punjab",
    cities: [
      "Lahore",
      "Faisalabad",
      "Rawalpindi",
      "Gujranwala",
      "Multan",
      "Sialkot",
      "Bahawalpur",
      "Sargodha",
      "Gujrat",
      "Sheikhupura",
      "Jhang",
      "Rahim Yar Khan",
      "Kasur",
      "Sahiwal",
      "Okara",
      "Dera Ghazi Khan",
      "Wah Cantonment",
      "Burewala",
      "Hafizabad",
      "Chiniot",
      "Mianwali",
      "Bhakkar",
      "Khushab",
      "Pakpattan",
      "Vehari",
      "Lodhran",
      "Khanewal",
      "Muzaffargarh",
      "Rajanpur",
      "Attock",
      "Chakwal",
      "Jhelum",
      "Narowal",
      "Nankana Sahib",
      "Toba Tek Singh",
      "Muridke",
      "Kamoke",
      "Sadiqabad",
      "Ahmadpur East",
      "Arifwala",
      "Mandi Bahauddin",
      "Shakargarh",
      "Lalamusa",
      "Kharian",
      "Jaranwala",
      "Pattoki",
      "Kot Addu",
      "Taunsa",
      "Fort Abbas",
      "Yazman"
    ]
  },
  {
    name: "Sindh",
    cities: [
      "Karachi",
      "Hyderabad",
      "Sukkur",
      "Larkana",
      "Nawabshah",
      "Mirpur Khas",
      "Jacobabad",
      "Shikarpur",
      "Khairpur",
      "Thatta",
      "Badin",
      "Dadu",
      "Jamshoro",
      "Tando Adam",
      "Tando Allahyar",
      "Tando Muhammad Khan",
      "Kotri",
      "Kashmore",
      "Kandhkot",
      "Ghotki",
      "Rohri",
      "Umerkot",
      "Matiari",
      "Sanghar",
      "Sehwan",
      "Naushahro Feroze",
      "Qambar",
      "Ratodero",
      "Moro"
    ]
  },
  {
    name: "Khyber Pakhtunkhwa",
    cities: [
      "Peshawar",
      "Mardan",
      "Mingora",
      "Kohat",
      "Abbottabad",
      "Mansehra",
      "Nowshera",
      "Swabi",
      "Dera Ismail Khan",
      "Charsadda",
      "Haripur",
      "Bannu",
      "Tank",
      "Lakki Marwat",
      "Timergara",
      "Batkhela",
      "Dir",
      "Chitral",
      "Karak",
      "Hangu",
      "Parachinar",
      "Shangla",
      "Torghar",
      "Malakand",
      "Upper Dir",
      "Lower Dir"
    ]
  },
  {
    name: "Balochistan",
    cities: [
      "Quetta",
      "Turbat",
      "Khuzdar",
      "Hub",
      "Chaman",
      "Gwadar",
      "Sibi",
      "Zhob",
      "Loralai",
      "Pishin",
      "Kalat",
      "Mastung",
      "Nushki",
      "Panjgur",
      "Kharan",
      "Washuk",
      "Awaran",
      "Dera Murad Jamali",
      "Jaffarabad",
      "Usta Muhammad",
      "Barkhan",
      "Musakhel",
      "Qila Saifullah",
      "Qila Abdullah"
    ]
  },
  {
    name: "Islamabad Capital Territory",
    cities: [
      "Islamabad"
    ]
  },
  {
    name: "Azad Kashmir",
    cities: [
      "Muzaffarabad",
      "Mirpur",
      "Rawalakot",
      "Bagh",
      "Kotli",
      "Bhimber",
      "Hattian Bala",
      "Haveli",
      "Neelum",
      "Pallandri"
    ]
  },
  {
    name: "Gilgit-Baltistan",
    cities: [
      "Gilgit",
      "Skardu",
      "Hunza",
      "Diamer",
      "Ghanche",
      "Kharmang",
      "Shigar",
      "Astore",
      "Ghizer",
      "Nagar",
      "Darel",
      "Tangir"
    ]
  }
];

// Note: Districts are often used interchangeably with cities or larger areas in many UX flows.
// For simplicity and high signal, we will use Provinces -> Cities. 
// If specific districts are needed per city, we can expand this.
