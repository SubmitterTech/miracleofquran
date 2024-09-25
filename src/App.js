import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dev from './pages/Dev';
import Plain from './pages/Plain';

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<Plain />} />
        <Route path="/miracleofquran" element={<Plain />} />
        <Route path="/miracleofquran/dev" element={<Dev />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="*" element={<Plain />} />
      </Routes>
    </Router>
  );
}

export default App;