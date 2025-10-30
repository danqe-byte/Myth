import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import VTT from './pages/VTT.jsx';
import HelpModal from './components/HelpModal.jsx';

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vtt" element={<VTT />} />
      </Routes>
      <HelpModal />
    </>
  );
};

export default App;
