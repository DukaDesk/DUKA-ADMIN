import * as m from "../services/mockData";

const dash = m.dashboard;
const rev = m.revenue;

export const revData = dash.revenueGrowth.map((r) => ({ m: r.month, v: r.value }));
export const userGrowth = dash.merchantGrowth.map((r) => ({ w: r.week, users: r.count }));
export const appsBycat = dash.appsByCategory.map((r) => ({ cat: r.category, count: r.count }));
export const recentMerchants = dash.recentMerchants.map((r) => ({
  name: r.name, biz: r.business, plan: r.plan, status: r.status, apps: r.apps, joined: r.joined,
}));
export const pendingApps = dash.pendingApps.map((r) => ({ merchant: r.merchant, app: r.name, time: r.submitted }));
export const usersData = m.users;
export const merchantsData = m.merchants;
export const appsData = m.apps;
export const checkItems = m.checkItems;
export const reportsData = m.reports;
export const revMonths = rev.monthly.map((r) => ({ m: r.month, v: r.value / 1000000 }));
export const planData = rev.plans;
export const planPie = rev.planDistribution;
export const waitlistData = m.waitlist;


