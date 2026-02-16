/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design-System Farben für verschiedene Bereiche
        inventory: {
          primary: '#10b981', // green-600
          light: '#d1fae5', // green-100
          dark: '#059669', // green-700
        },
        calendar: {
          primary: '#3b82f6', // blue-600
          light: '#dbeafe', // blue-100
          dark: '#2563eb', // blue-700
        },
        customer: {
          primary: '#9333ea', // purple-600
          light: '#f3e8ff', // purple-100
          dark: '#7e22ce', // purple-700
        },
        booking: {
          primary: '#f97316', // orange-600
          light: '#ffedd5', // orange-100
          dark: '#ea580c', // orange-700
        },
        auth: {
          primary: '#4f46e5', // indigo-600
          light: '#e0e7ff', // indigo-100
          dark: '#4338ca', // indigo-700
        },
      },
    },
  },
  plugins: [],
}

