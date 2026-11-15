import type { TranslationModule } from "./types";

const user: TranslationModule = {
  en: {
    // User Requests
    "userRequests.title": "My Requests",
    "userRequests.subtitle": "Track your roadside assistance and maintenance requests",

    // Shops
    "shops.title": "Nearby Service Centers",
    "shops.subtitle": "Find trusted repair shops and parts stores near you",
  },
  ar: {
    // User Requests
    "userRequests.title": "طلباتي",
    "userRequests.subtitle": "تتبع طلبات المساعدة على الطريق والصيانة",

    // Shops
    "shops.title": "مراكز الخدمة القريبة",
    "shops.subtitle": "اعثر على ورش صيانة ومتاجر قطع غيار موثوقة بالقرب منك",
  },
};

export default user;
