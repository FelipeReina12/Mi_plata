# Aplicación movil de finanzas 
## Crear el proyecto
Para crear el proyecto de nombre mi Plata con React, ejecutamos el comando:  

```nmp create vite@latest miplata -- --template react```

Luego ejecutamos los siguientes comandos:

``` npm install ```   
``` npm run dev ```

Después del último comando verás algo así:   

VITE v5.x.x  ready in 300ms   
➜  Local:   http://localhost:5173/

## Limpiar la app de ejemplo
Abrimos la carpeta ``` scr/App.jsx ``` borramos el contenido y lo reemplazamos por lo siguiente:
``` 
function App() {
  return (
    <div>
      <h1>MiPlata</h1>
      <p>App de finanzas personales</p>
    </div>
  )
}

export default App
```
## Instalar las libreíras necesarias 
Ejecutamos el siguiente comando:
``` npm install recharts lucide-react ```  
+ recharts → las gráficas de barras y torta   
+ lucide-react → los íconos

## Crear la estructura de las carpetas

Dentro de ` src/ ` creamos las carpeta ` data/ ` y la carpeta ` components/ ` que es para piezas reutilizables de la interfaz.    
Dentro de la carpeta ` components/ ` creamos las siguientes carpetas:
+ ` Layout/ `  ← sidebar y estructura general
+ ` Dashboard/ ` ← pantalla principal
+ ` Transactions/ ` ← formulario y lista de movimientos

## Crear datos de ejemplo
Dentro de la carpeta ` src/data/ ` creamos el archivo ` mockData.js ` y pegamos el siguiente código:
```
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
```
# ¿Que es un componente?
Es como un bloque de LEGO. en HTML normalmente se haría todo en un archivo gigante. En React, cada pieza de la interfaz es un archivo separado que se puede reutilizar. El Sidebar es un componente, cada tarjeta de metrica es un componente, etc.

## Componente 1 Sidebar
Creamos el archivo ` src/components/Layout/Sidebar.jsx ` y dentro el siguiente código