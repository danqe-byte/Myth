import { motion, AnimatePresence } from 'framer-motion';

const Drawer = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <header className="drawer-header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{title}</h2>
              <button className="btn btn-secondary" onClick={onClose}>
                Закрыть
              </button>
            </header>
            <div className="drawer-body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
