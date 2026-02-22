
export interface Village {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface City {
  id: number;
  nameAr: string;
  nameEn: string;
  regionId: number;
  regionName: string;
  villages: Village[];
}

export const palestineVillages: City[] = [
  {
    id: 1, nameAr: 'رام الله', nameEn: 'Ramallah', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 101, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 102, nameAr: 'البيرة', nameEn: 'Al-Bireh' },
      { id: 103, nameAr: 'بيتونيا', nameEn: 'Bitunia' },
      { id: 104, nameAr: 'بيرزيت', nameEn: 'Birzeit' },
      { id: 105, nameAr: 'الطيرة', nameEn: 'Al-Tireh' },
      { id: 106, nameAr: 'عين منجد', nameEn: 'Ein Munjed' },
      { id: 107, nameAr: 'الماسيون', nameEn: 'Al-Masyoun' },
      { id: 108, nameAr: 'بيتين', nameEn: 'Beitin' },
      { id: 109, nameAr: 'سلواد', nameEn: 'Silwad' },
      { id: 110, nameAr: 'نعلين', nameEn: 'Ni\'lin' }
    ]
  },
  {
    id: 2, nameAr: 'نابلس', nameEn: 'Nablus', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 201, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 202, nameAr: 'رفيديا', nameEn: 'Rafidia' },
      { id: 203, nameAr: 'بلاطة', nameEn: 'Balata' },
      { id: 204, nameAr: 'عسكر', nameEn: 'Askar' },
      { id: 205, nameAr: 'عصيرة الشمالية', nameEn: 'Asira Ash-Shamaliya' },
      { id: 206, nameAr: 'بيت ايبا', nameEn: 'Beit Iba' },
      { id: 207, nameAr: 'حوارة', nameEn: 'Huwwara' },
      { id: 208, nameAr: 'تل', nameEn: 'Tell' }
    ]
  },
  {
    id: 3, nameAr: 'الخليل', nameEn: 'Hebron', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 301, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 302, nameAr: 'دورا', nameEn: 'Dura' },
      { id: 303, nameAr: 'حلحول', nameEn: 'Halhul' },
      { id: 304, nameAr: 'يطا', nameEn: 'Yatta' },
      { id: 305, nameAr: 'الظاهرية', nameEn: 'Ad-Dhahiriya' },
      { id: 306, nameAr: 'بني نعيم', nameEn: 'Bani Na\'im' },
      { id: 307, nameAr: 'إذنا', nameEn: 'Idhna' },
      { id: 308, nameAr: 'ترقوميا', nameEn: 'Tarqumiya' }
    ]
  },
  {
    id: 4, nameAr: 'جنين', nameEn: 'Jenin', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 401, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 402, nameAr: 'مخيم جنين', nameEn: 'Jenin Camp' },
      { id: 403, nameAr: 'قباطية', nameEn: 'Qabatiya' },
      { id: 404, nameAr: 'يعبد', nameEn: 'Ya\'bad' },
      { id: 405, nameAr: 'الزبابدة', nameEn: 'Zababdeh' },
      { id: 406, nameAr: 'برقين', nameEn: 'Burqin' },
      { id: 407, nameAr: 'اليامون', nameEn: 'Al-Yamun' }
    ]
  },
  {
    id: 5, nameAr: 'طولكرم', nameEn: 'Tulkarm', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 501, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 502, nameAr: 'ضاحية شويكة', nameEn: 'Shuweika' },
      { id: 503, nameAr: 'ضاحية ذنابة', nameEn: 'Dhanabba' },
      { id: 504, nameAr: 'عنبتا', nameEn: 'Anabta' },
      { id: 505, nameAr: 'دير الغصون', nameEn: 'Deir al-Ghusun' },
      { id: 506, nameAr: 'بلعا', nameEn: 'Bala\'a' },
      { id: 507, nameAr: 'قفين', nameEn: 'Qaffin' }
    ]
  },
  {
    id: 6, nameAr: 'بيت لحم', nameEn: 'Bethlehem', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 601, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 602, nameAr: 'بيت جالا', nameEn: 'Beit Jala' },
      { id: 603, nameAr: 'بيت ساحور', nameEn: 'Beit Sahour' },
      { id: 604, nameAr: 'الخضر', nameEn: 'Al-Khader' },
      { id: 605, nameAr: 'الدوحة', nameEn: 'Ad-Doha' },
      { id: 606, nameAr: 'تقوع', nameEn: 'Tuqu\'' },
      { id: 607, nameAr: 'بيت فجار', nameEn: 'Beit Fajjar' }
    ]
  },
  {
    id: 7, nameAr: 'أريحا', nameEn: 'Jericho', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 701, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 702, nameAr: 'العوجا', nameEn: 'Al-Auja' },
      { id: 703, nameAr: 'النويعمة', nameEn: 'An-Nuway\'imah' },
      { id: 704, nameAr: 'عقبة جبر', nameEn: 'Aqbat Jaber' }
    ]
  },
  {
    id: 8, nameAr: 'قلقيلية', nameEn: 'Qalqilya', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 801, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 802, nameAr: 'عزون', nameEn: 'Azzun' },
      { id: 803, nameAr: 'حبلة', nameEn: 'Habla' },
      { id: 804, nameAr: 'كفر ثلث', nameEn: 'Kafr Thulth' },
      { id: 805, nameAr: 'جيوس', nameEn: 'Jayyous' }
    ]
  },
  {
    id: 9, nameAr: 'سلفيت', nameEn: 'Salfit', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 901, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 902, nameAr: 'بديا', nameEn: 'Biddya' },
      { id: 903, nameAr: 'الزاوية', nameEn: 'Az-Zawiya' },
      { id: 904, nameAr: 'بروقين', nameEn: 'Bruqin' },
      { id: 905, nameAr: 'كفل حارس', nameEn: 'Kifl Haris' }
    ]
  },
  {
    id: 10, nameAr: 'طوباس', nameEn: 'Tubas', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 1001, nameAr: 'مركز المدينة', nameEn: 'City Center' },
      { id: 1002, nameAr: 'طمون', nameEn: 'Tammun' },
      { id: 1003, nameAr: 'عقابا', nameEn: 'Aqqaba' },
      { id: 1004, nameAr: 'تياسير', nameEn: 'Tayasir' }
    ]
  },
  {
    id: 11, nameAr: 'القدس', nameEn: 'Jerusalem', regionId: 1, regionName: 'West Bank',
    villages: [
      { id: 1101, nameAr: 'القدس', nameEn: 'Jerusalem' },
      { id: 1102, nameAr: 'شعفاط', nameEn: 'Shuafat' },
      { id: 1103, nameAr: 'بيت حنينا', nameEn: 'Beit Hanina' },
      { id: 1104, nameAr: 'الرام', nameEn: 'Al-Ram' },
      { id: 1105, nameAr: 'كفر عقب', nameEn: 'Kafr Aqab' },
      { id: 1106, nameAr: 'أبو ديس', nameEn: 'Abu Dis' },
      { id: 1107, nameAr: 'العيزرية', nameEn: 'Al-Eizariya' }
    ]
  },
  {
    id: 12, nameAr: 'غزة', nameEn: 'Gaza', regionId: 2, regionName: 'Gaza Strip',
    villages: [
      { id: 1201, nameAr: 'مدينة غزة', nameEn: 'Gaza City' },
      { id: 1202, nameAr: 'رفح', nameEn: 'Rafah' },
      { id: 1203, nameAr: 'خان يونس', nameEn: 'Khan Yunis' },
      { id: 1204, nameAr: 'جباليا', nameEn: 'Jabalia' },
      { id: 1205, nameAr: 'بيت لاهيا', nameEn: 'Beit Lahia' },
      { id: 1206, nameAr: 'دير البلح', nameEn: 'Deir al-Balah' },
      { id: 1207, nameAr: 'النصيرات', nameEn: 'Nuseirat' },
      { id: 1208, nameAr: 'البريج', nameEn: 'Bureij' }
    ]
  }
];
