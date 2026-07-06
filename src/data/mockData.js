export const wallets = [
  { id: 1, name: "Efectivo",     color: "#888780", balance: 350000 },
  { id: 2, name: "Nequi",        color: "#1D9E75", balance: 890500 },
  { id: 3, name: "Bancolombia",  color: "#185FA5", balance: 1600000 },
]

export const transactions = [
  { id: 1, description: "Nómina junio",   category: "Salario",          wallet: "Bancolombia", date: "2025-06-10", amount: 3200000, type: "income"  },
  { id: 2, description: "D1 - mercado",   category: "Comida",           wallet: "Nequi",       date: "2025-06-09", amount: 87500,   type: "expense" },
  { id: 3, description: "Transmilenio",   category: "Transporte",       wallet: "Nequi",       date: "2025-06-09", amount: 5800,    type: "expense" },
  { id: 4, description: "Netflix",        category: "Entretenimiento",  wallet: "Bancolombia", date: "2025-06-08", amount: 26900,   type: "expense" },
  { id: 5, description: "Freelance web",  category: "Otros ingresos",   wallet: "Nequi",       date: "2025-06-07", amount: 500000,  type: "income"  },
  { id: 6, description: "Agua y luz",     category: "Servicios",        wallet: "Efectivo",    date: "2025-06-05", amount: 115000,  type: "expense" },
]

export const categories = [
  { name: "Comida",         color: "#D85A30", icon: "ShoppingCart" },
  { name: "Transporte",     color: "#185FA5", icon: "Bus"          },
  { name: "Servicios",      color: "#7F77DD", icon: "Zap"          },
  { name: "Entretenimiento",color: "#EF9F27", icon: "Tv"           },
  { name: "Salario",        color: "#1D9E75", icon: "Briefcase"    },
  { name: "Otros ingresos", color: "#1D9E75", icon: "TrendingUp"   },
  { name: "Otros",          color: "#888780", icon: "MoreHorizontal"},
]