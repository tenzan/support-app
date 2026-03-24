import { Routes, Route } from 'react-router'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Support App</h1>
              <p className="mt-2 text-gray-600">Coming soon</p>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
