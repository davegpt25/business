import { create } from 'zustand';
import { closetAPI } from '../api/client';

const useClosetStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (category) => {
    set({ loading: true, error: null });
    try {
      const res = await closetAPI.getItems(category ? { category } : {});
      set({ items: res.data.items, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const res = await closetAPI.addItem(itemData);
      set((state) => ({ items: [res.data.item, ...state.items], loading: false }));
      return res.data.item;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await closetAPI.deleteItem(id);
      set((state) => ({ items: state.items.filter((i) => i.id !== id), loading: false }));
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
}));

export default useClosetStore;
