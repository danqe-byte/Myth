import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid.js';

const DEFAULT_STATE = {
  campaigns: [],
  activeCampaignId: null,
  lastSceneId: null
};

const cloneScene = (scene) => {
  if (!scene) return null;
  const sceneId = scene.id || scene.sceneId || nanoid();
  return JSON.parse(
    JSON.stringify({
      ...scene,
      id: sceneId
    })
  );
};

export const useCampaignStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      createCampaign: (name = 'Новая кампания') => {
        const id = nanoid();
        const newCampaign = {
          id,
          name,
          scenes: []
        };
        set((state) => ({
          campaigns: [...state.campaigns, newCampaign],
          activeCampaignId: id
        }));
        return id;
      },
      deleteCampaign: (id) => {
        set((state) => {
          const campaigns = state.campaigns.filter((campaign) => campaign.id !== id);
          const activeCampaignId = state.activeCampaignId === id ? campaigns[0]?.id || null : state.activeCampaignId;
          const lastSceneId = activeCampaignId === state.activeCampaignId ? state.lastSceneId : null;
          return { campaigns, activeCampaignId, lastSceneId };
        });
      },
      duplicateCampaign: (id) => {
        const campaign = get().campaigns.find((item) => item.id === id);
        if (!campaign) return null;
        const duplicatedId = nanoid();
        const duplicated = {
          id: duplicatedId,
          name: `${campaign.name} (копия)`,
          scenes: campaign.scenes.map((scene) => cloneScene(scene))
        };
        set((state) => ({ campaigns: [...state.campaigns, duplicated] }));
        return duplicatedId;
      },
      setActiveCampaign: (id) => {
        set({ activeCampaignId: id || null });
      },
      saveSceneToCampaign: (scene, { campaignId, sceneId } = {}) => {
        const targetCampaignId = campaignId || get().activeCampaignId;
        if (!targetCampaignId || !scene) return null;
        const sceneToSave = cloneScene(scene);
        if (!sceneToSave) return null;
        const finalSceneId = sceneId || sceneToSave.id || nanoid();
        sceneToSave.id = finalSceneId;
        set((state) => {
          const campaigns = state.campaigns.map((campaign) => {
            if (campaign.id !== targetCampaignId) return campaign;
            const exists = campaign.scenes.find((item) => item.id === finalSceneId);
            const scenes = exists
              ? campaign.scenes.map((item) => (item.id === finalSceneId ? sceneToSave : item))
              : [...campaign.scenes, sceneToSave];
            return { ...campaign, scenes };
          });
          return { campaigns, activeCampaignId: targetCampaignId, lastSceneId: finalSceneId };
        });
        return finalSceneId;
      },
      loadSceneFromCampaign: (campaignId, sceneId) => {
        const campaigns = get().campaigns;
        const campaign = campaigns.find((item) => item.id === campaignId);
        if (!campaign) return null;
        const scene = campaign.scenes.find((item) => item.id === sceneId) || null;
        if (scene) {
          set({ activeCampaignId: campaignId, lastSceneId: sceneId });
          return cloneScene(scene);
        }
        return null;
      },
      exportCampaign: (campaignId) => {
        const campaign = get().campaigns.find((item) => item.id === campaignId);
        if (!campaign) return;
        try {
          const data = JSON.stringify(campaign, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${campaign.name || 'campaign'}.json`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export campaign', error);
        }
      },
      importCampaign: (data) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (!parsed) return;
          const campaign = {
            id: parsed.id || nanoid(),
            name: parsed.name || 'Импортированная кампания',
            scenes: Array.isArray(parsed.scenes) ? parsed.scenes.map((scene) => cloneScene(scene)).filter(Boolean) : []
          };
          set((state) => ({ campaigns: [...state.campaigns, campaign] }));
          return campaign.id;
        } catch (error) {
          console.error('Failed to import campaign', error);
          return null;
        }
      },
      resetCampaigns: () => set({ ...DEFAULT_STATE })
    }),
    {
      name: 'mythcrit-campaigns',
      version: 1,
      migrate: (state) => ({ ...DEFAULT_STATE, ...state })
    }
  )
);
