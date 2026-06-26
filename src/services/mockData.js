const now = Date.now();
const day = 86400000;

export const admin = {
  id: "adm_001",
  name: "Super Admin",
  email: "admin@dukadesk.com",
  role: "super_admin",
  avatar: "SA",
  twoFA: true,
  joined: "2024-01-15",
};

export const dashboard = {
  kpis: [
    { id: "kpi_users", label: "Total Users", value: "48,204", trend: "+1,240 this month", up: true },
    { id: "kpi_merchants", label: "Total Merchants", value: "2,847", trend: "+89 this month", up: true },
    { id: "kpi_apps", label: "Published Apps", value: "1,592", trend: "+34 this week", up: true },
    { id: "kpi_mrr", label: "Platform MRR", value: "₦9.2M", trend: "+18% vs last month", up: true },
    { id: "kpi_reports", label: "Open Reports", value: "23", trend: "3 Critical ⚡", up: false },
  ],
  criticalAlerts: [
    { id: "alert_1", message: "3 critical reports require immediate review. Merchants may be engaging in fraudulent activity.", type: "critical", count: 3, link: "reports" },
  ],
  revenueGrowth: [
    { month: "Jan", value: 3200000 },
    { month: "Feb", value: 4100000 },
    { month: "Mar", value: 5500000 },
    { month: "Apr", value: 4900000 },
    { month: "May", value: 7800000 },
    { month: "Jun", value: 9200000 },
  ],
  merchantGrowth: [
    { week: "W1", count: 1200 },
    { week: "W2", count: 1850 },
    { week: "W3", count: 2400 },
    { week: "W4", count: 2847 },
  ],
  appsByCategory: [
    { category: "Restaurant", count: 420 },
    { category: "Ecommerce", count: 380 },
    { category: "Grocery", count: 210 },
    { category: "Church", count: 180 },
    { category: "School", count: 150 },
    { category: "Booking", count: 252 },
  ],
  recentMerchants: [
    { id: "m_01", name: "Ada Okafor", business: "Mama's Kitchen", plan: "Starter", status: "Active", apps: 1, joined: "Jun 22" },
    { id: "m_02", name: "Ibrahim Musa", business: "IB Fashions", plan: "Growth", status: "Active", apps: 2, joined: "Jun 21" },
    { id: "m_03", name: "Grace Eze", business: "Grace Salon", plan: "Business", status: "Active", apps: 1, joined: "Jun 20" },
    { id: "m_04", name: "Emeka Obi", business: "Emeka Groceries", plan: "Starter", status: "Suspended", apps: 1, joined: "Jun 19" },
    { id: "m_05", name: "Fatima Bello", business: "Fatima's Bakes", plan: "Growth", status: "Active", apps: 3, joined: "Jun 18" },
  ],
  pendingApps: [
    { id: "app_01", merchant: "Ada Okafor", name: "Mama's Kitchen", submitted: "2 hrs ago" },
    { id: "app_02", merchant: "New Founder", name: "Fresh Mart", submitted: "4 hrs ago" },
    { id: "app_03", merchant: "David Church", name: "Grace Assembly", submitted: "5 hrs ago" },
  ],
};

export const users = [
  { id: "usr_1", name: "Ada Okafor", email: "ada@gmail.com", role: "Merchant", status: "Active", plan: "Starter", apps: 1, joined: "Jun 1", lastActive: "Today", phone: "+2348011110001" },
  { id: "usr_2", name: "Chika Obi", email: "chika@gmail.com", role: "Consumer", status: "Active", plan: null, apps: 0, joined: "Jun 3", lastActive: "Yesterday", phone: "+2348011110002" },
  { id: "usr_3", name: "Tunde Adeyemi", email: "tunde@gmail.com", role: "Consumer", status: "Active", plan: null, apps: 0, joined: "Jun 5", lastActive: "2 days ago", phone: "+2348011110003" },
  { id: "usr_4", name: "Ibrahim Musa", email: "ibrahim@gmail.com", role: "Merchant", status: "Suspended", plan: "Growth", apps: 2, joined: "May 3", lastActive: "Jun 10", phone: "+2348011110004" },
  { id: "usr_5", name: "Grace Eze", email: "grace@gmail.com", role: "Merchant", status: "Active", plan: "Business", apps: 1, joined: "Apr 15", lastActive: "Today", phone: "+2348011110005" },
  { id: "usr_6", name: "Fatima Bello", email: "fatima@gmail.com", role: "Consumer", status: "Banned", plan: null, apps: 0, joined: "May 20", lastActive: "Jun 1", phone: "+2348011110006" },
  { id: "usr_7", name: "David Nwachukwu", email: "david@gmail.com", role: "Merchant", status: "Active", plan: "Growth", apps: 3, joined: "Mar 10", lastActive: "Today", phone: "+2348011110007" },
  { id: "usr_8", name: "Amaka Johnson", email: "amaka@gmail.com", role: "Consumer", status: "Active", plan: null, apps: 0, joined: "Jun 15", lastActive: "Today", phone: "+2348011110008" },
  { id: "usr_9", name: "Oluwaseun Adekunle", email: "seun@gmail.com", role: "Merchant", status: "Active", plan: "Growth", apps: 2, joined: "May 28", lastActive: "Today", phone: "+2348011110009" },
  { id: "usr_10", name: "Ngozi Eze", email: "ngozi@gmail.com", role: "Merchant", status: "Active", plan: "Enterprise", apps: 5, joined: "Feb 1", lastActive: "Today", phone: "+2348011110010" },
  { id: "usr_11", name: "Chidi Okonkwo", email: "chidi@gmail.com", role: "Consumer", status: "Active", plan: null, apps: 0, joined: "Jun 18", lastActive: "Yesterday", phone: "+2348011110011" },
  { id: "usr_12", name: "Bola Tinubu", email: "bola@gmail.com", role: "Merchant", status: "Suspended", plan: "Starter", apps: 1, joined: "Apr 20", lastActive: "Jun 5", phone: "+2348011110012" },
];

export const merchants = [
  { id: "m_01", name: "Ada Okafor", business: "Mama's Kitchen", category: "Restaurant", plan: "Starter", status: "Active", apps: 1, customers: 1204, revenue: 48200, joined: "Jun 1", email: "ada@mamaskitchen.com", phone: "+2348011110001", city: "Lagos" },
  { id: "m_02", name: "Ibrahim Musa", business: "IB Fashions", category: "Ecommerce", plan: "Growth", status: "Active", apps: 2, customers: 892, revenue: 124000, joined: "Apr 5", email: "ibrahim@ibfashions.com", phone: "+2348011110004", city: "Kano" },
  { id: "m_03", name: "Grace Eze", business: "Grace Salon", category: "Booking", plan: "Business", status: "Active", apps: 1, customers: 540, revenue: 87000, joined: "Mar 10", email: "grace@gracesalon.com", phone: "+2348011110005", city: "Abuja" },
  { id: "m_04", name: "David Nwachukwu", business: "Grace Assembly", category: "Church", plan: "Growth", status: "Active", apps: 3, customers: 2100, revenue: 0, joined: "Jan 15", email: "david@graceassembly.com", phone: "+2348011110007", city: "PH" },
  { id: "m_05", name: "Emeka Obi", business: "Emeka Groceries", category: "Grocery", plan: "Starter", status: "Suspended", apps: 1, customers: 234, revenue: 15000, joined: "May 3", email: "emeka@emekagroceries.com", phone: "+2348011110013", city: "Lagos" },
  { id: "m_06", name: "Oluwaseun Adekunle", business: "Seun's Tech Hub", category: "Ecommerce", plan: "Growth", status: "Active", apps: 2, customers: 678, revenue: 92000, joined: "May 28", email: "seun@seonstech.com", phone: "+2348011110009", city: "Lagos" },
  { id: "m_07", name: "Ngozi Eze", business: "Ngozi's Boutique", category: "Ecommerce", plan: "Enterprise", status: "Active", apps: 5, customers: 3400, revenue: 450000, joined: "Feb 1", email: "ngozi@ngoziboutique.com", phone: "+2348011110010", city: "Abuja" },
  { id: "m_08", name: "Fatima Bello", business: "Fatima's Bakes", category: "Restaurant", plan: "Growth", status: "Active", apps: 3, customers: 1560, revenue: 189000, joined: "Jun 18", email: "fatima@fatimasbakes.com", phone: "+2348011110014", city: "Ibadan" },
];

export const apps = [
  { id: "app_01", name: "Mama's Kitchen", merchant: "Ada Okafor", merchantId: "m_01", category: "Restaurant", status: "Under Review", submitted: "2 hrs ago", logo: "🍛", checklist: [true, true, true, true, true, false] },
  { id: "app_02", name: "Fresh Mart", merchant: "Emeka Obi", merchantId: "m_05", category: "Grocery", status: "Under Review", submitted: "4 hrs ago", logo: "🛒", checklist: [true, true, true, false, false, false] },
  { id: "app_03", name: "Grace Assembly", merchant: "David Nwachukwu", merchantId: "m_04", category: "Church", status: "Under Review", submitted: "5 hrs ago", logo: "⛪", checklist: [true, true, true, true, false, true] },
  { id: "app_04", name: "IB Fashions", merchant: "Ibrahim Musa", merchantId: "m_02", category: "Ecommerce", status: "Live", submitted: "Jun 10", logo: "👗", checklist: [true, true, true, true, true, true] },
  { id: "app_05", name: "Grace Salon", merchant: "Grace Eze", merchantId: "m_03", category: "Booking", status: "Live", submitted: "Jun 5", logo: "💇", checklist: [true, true, true, true, true, true] },
  { id: "app_06", name: "Fake Ecommerce", merchant: "Unknown", merchantId: null, category: "Ecommerce", status: "Rejected", submitted: "Jun 8", logo: "❌", checklist: [false, false, true, false, false, false] },
  { id: "app_07", name: "Seun's Tech Hub", merchant: "Oluwaseun Adekunle", merchantId: "m_06", category: "Ecommerce", status: "Live", submitted: "May 30", logo: "💻", checklist: [true, true, true, true, true, true] },
  { id: "app_08", name: "Ngozi's Boutique", merchant: "Ngozi Eze", merchantId: "m_07", category: "Ecommerce", status: "Live", submitted: "Feb 10", logo: "👠", checklist: [true, true, true, true, true, true] },
  { id: "app_09", name: "Fatima's Bakes", merchant: "Fatima Bello", merchantId: "m_08", category: "Restaurant", status: "Live", submitted: "Jun 20", logo: "🥐", checklist: [true, true, true, true, true, true] },
];

export const checkItems = [
  "Business name present",
  "Logo uploaded",
  "Category correctly selected",
  "Template applied",
  "Payment integration connected",
  "Business hours set",
];

export const reports = [
  { id: "MOD-041", reporter: "Chika Obi", reporterId: "usr_2", subject: "Mama's Kitchen", type: "Fraud", priority: "Critical", status: "Under Review", submitted: "2 hrs ago", assigned: "Admin A", assigneeId: "adm_001", description: "This business took my payment and never delivered the food. I have screenshots of the transaction." },
  { id: "MOD-040", reporter: "Tunde Adeyemi", reporterId: "usr_3", subject: "IB Fashions", type: "Harassment", priority: "Critical", status: "Under Review", submitted: "4 hrs ago", assigned: "Unassigned", assigneeId: null, description: "The merchant sent me threatening messages when I asked for a refund." },
  { id: "MOD-039", reporter: "Fatima Bello", reporterId: "usr_6", subject: "Unknown Store", type: "Spam", priority: "Medium", status: "Under Review", submitted: "1 day ago", assigned: "Admin B", assigneeId: "adm_002", description: "This merchant is sending unsolicited promotional messages to my number repeatedly." },
  { id: "MOD-038", reporter: "Ibrahim Musa", reporterId: "usr_4", subject: "Fresh Mart", type: "Fake Business", priority: "High", status: "Under Review", submitted: "2 days ago", assigned: "Unassigned", assigneeId: null, description: "This store claims to be a licensed grocery but I suspect it is not real." },
  { id: "MOD-037", reporter: "Grace Eze", reporterId: "usr_5", subject: "Dodgy Shop", type: "Scam", priority: "High", status: "Resolved", submitted: "Jun 18", assigned: "Admin A", assigneeId: "adm_001", description: "Products listed don't match what was delivered." },
  { id: "MOD-036", reporter: "Amaka Johnson", reporterId: "usr_8", subject: "Grace Salon", type: "Harassment", priority: "Medium", status: "Resolved", submitted: "Jun 15", assigned: "Admin A", assigneeId: "adm_001", description: "Staff was rude and refused service." },
];

export const revenue = {
  overview: {
    mrr: 9200000,
    arrProjected: 110400000,
    payingMerchants: 755,
    churnThisMonth: 12,
    totalMrr: 11897800,
  },
  monthly: [
    { month: "Jan", value: 3200000 },
    { month: "Feb", value: 4100000 },
    { month: "Mar", value: 5500000 },
    { month: "Apr", value: 4900000 },
    { month: "May", value: 7800000 },
    { month: "Jun", value: 9200000 },
  ],
  plans: [
    { name: "Starter (Free)", mrr: 0, merchants: 2092, churn: "8%" },
    { name: "Growth", mrr: 5198000, merchants: 520, churn: "3%" },
    { name: "Business", mrr: 4999800, merchants: 200, churn: "2%" },
    { name: "Enterprise", mrr: 1700000, merchants: 35, churn: "0%" },
  ],
  planDistribution: [
    { name: "Growth", value: 56 },
    { name: "Business", value: 22 },
    { name: "Enterprise", value: 18 },
    { name: "Other", value: 4 },
  ],
};

export const waitlist = [
  { id: "wl_1", name: "Ngozi Adichie", email: "ngozi@gmail.com", type: "Restaurant", city: "Lagos", signed: "Jun 1", status: "Invited" },
  { id: "wl_2", name: "Chidi Okeke", email: "chidi@gmail.com", type: "Fashion", city: "Abuja", signed: "Jun 3", status: "Not Invited" },
  { id: "wl_3", name: "Amara Osei", email: "amara@gmail.com", type: "Salon", city: "PH", signed: "Jun 5", status: "Joined" },
  { id: "wl_4", name: "Tolu Balogun", email: "tolu@gmail.com", type: "Grocery", city: "Lagos", signed: "Jun 6", status: "Not Invited" },
  { id: "wl_5", name: "Kemi Adeyemi", email: "kemi@gmail.com", type: "School", city: "Ibadan", signed: "Jun 8", status: "Invited" },
  { id: "wl_6", name: "Femi Oladele", email: "femi@gmail.com", type: "Church", city: "Lagos", signed: "Jun 10", status: "Joined" },
  { id: "wl_7", name: "Simi Adebayo", email: "simi@gmail.com", type: "Fashion", city: "Lagos", signed: "Jun 12", status: "Not Invited" },
  { id: "wl_8", name: "Ken Okafor", email: "ken@gmail.com", type: "Restaurant", city: "Abuja", signed: "Jun 14", status: "Not Invited" },
];

export const settings = {
  twoFA: true,
  emailAlerts: true,
  slackAlerts: false,
  autoApprove: false,
  team: [
    { id: "adm_001", name: "Super Admin", email: "admin@dukadesk.com", role: "Super Admin", color: "#E74C3C" },
    { id: "adm_002", name: "Admin B", email: "adminb@dukadesk.com", role: "Moderator", color: "#F4A026" },
    { id: "adm_003", name: "Admin C", email: "adminc@dukadesk.com", role: "Viewer", color: "#2ECC71" },
  ],
};

export const notifications = [
  { id: "notif_1", icon: "🛡️", text: "3 critical reports need review", time: "2 min ago", urgent: true, link: "reports" },
  { id: "notif_2", icon: "📱", text: "Mama's Kitchen app submitted for review", time: "15 min ago", urgent: false, link: "apps" },
  { id: "notif_3", icon: "💰", text: "MRR milestone: ₦9M reached", time: "1 hr ago", urgent: false, link: "revenue" },
  { id: "notif_4", icon: "👥", text: "50 new merchant signups today", time: "3 hrs ago", urgent: false, link: "merchants" },
];

export const navItems = [
  { id: "dashboard", icon: "📊", label: "Overview" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "merchants", icon: "🏪", label: "Merchants" },
  { id: "apps", icon: "📱", label: "Apps", badge: 8 },
  { id: "reports", icon: "🛡️", label: "Moderation", badge: 23, badgeColor: "#E74C3C" },
  { id: "revenue", icon: "💰", label: "Revenue" },
  { id: "waitlist", icon: "📋", label: "Waitlist" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];
