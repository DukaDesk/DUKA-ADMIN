# src

Source for Admin Portal shell per UI-0003.

- App.jsx — authenticated shell + PAGE_ROUTES + role-aware canAccessPage
- components/Layout/AdminSidebar.jsx — collapsible 68/260, badge polling
- pages/Dashboard/AdminDashboard.jsx — summary cards + RevenueChart/MerchantGrowthChart
- services/businessDashboard.js — live BFF /bff/admin/* + /admin/* + /bff/tenant/:id/*
