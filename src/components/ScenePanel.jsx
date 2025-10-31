import { useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';
import { useCampaignStore } from '../store/useCampaignStore.js';

const ScenePanel = () => {
  const scene = useSceneStore((state) => state.scene);
  const setScene = useSceneStore((state) => state.setScene);
  const updateScene = useSceneStore((state) => state.updateScene);
  const importScene = useSceneStore((state) => state.importScene);
  const exportScene = useSceneStore((state) => state.exportScene);
  const setUnitsPerGrid = useSceneStore((state) => state.setUnitsPerGrid);

  const campaigns = useCampaignStore((state) => state.campaigns);
  const activeCampaignId = useCampaignStore((state) => state.activeCampaignId);
  const lastSceneId = useCampaignStore((state) => state.lastSceneId);
  const createCampaign = useCampaignStore((state) => state.createCampaign);
  const deleteCampaign = useCampaignStore((state) => state.deleteCampaign);
  const duplicateCampaign = useCampaignStore((state) => state.duplicateCampaign);
  const setActiveCampaign = useCampaignStore((state) => state.setActiveCampaign);
  const saveSceneToCampaign = useCampaignStore((state) => state.saveSceneToCampaign);
  const loadSceneFromCampaign = useCampaignStore((state) => state.loadSceneFromCampaign);
  const exportCampaign = useCampaignStore((state) => state.exportCampaign);
  const importCampaign = useCampaignStore((state) => state.importCampaign);

  const sceneFileInputRef = useRef(null);
  const campaignFileInputRef = useRef(null);

  const handleImportClick = () => {
    sceneFileInputRef.current?.click();
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importScene(reader.result);
    };
    reader.readAsText(file);
  };

  const handleCampaignImportClick = () => {
    campaignFileInputRef.current?.click();
  };

  const handleCampaignImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importCampaign(reader.result);
    };
    reader.readAsText(file);
  };

  const handleCreateCampaign = () => {
    const name = window.prompt('Название кампании', 'Новая кампания');
    if (name) {
      createCampaign(name);
    }
  };

  const handleSaveSceneToCampaign = (campaignId) => {
    const target = campaignId || activeCampaignId;
    if (!target) return;
    const savedSceneId = saveSceneToCampaign(scene, { campaignId: target });
    if (savedSceneId) {
      console.info('Сцена сохранена в кампанию', target, savedSceneId);
    }
  };

  const handleLoadScene = (campaignId, sceneId) => {
    const loaded = loadSceneFromCampaign(campaignId, sceneId);
    if (loaded) {
      setScene(loaded);
    }
  };

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Сцена</h3>
        <div className="input-group">
          <label>Название сцены</label>
          <input type="text" value={scene.name} onChange={(event) => updateScene({ name: event.target.value })} />
        </div>
        <div className="input-group">
          <label>Режим вписывания карты</label>
          <select value={scene.fitMode} onChange={(event) => updateScene({ fitMode: event.target.value })}>
            <option value="contain">По размеру окна</option>
            <option value="cover">Во всю сцену</option>
            <option value="stretch">Растянуть</option>
          </select>
        </div>
        <div className="input-group">
          <label>Единицы измерения</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={scene.units.label}
              onChange={(event) => updateScene({ units: { ...scene.units, label: event.target.value } })}
            />
            <input
              type="number"
              min={1}
              value={scene.units.unitsPerGrid}
              onChange={(event) => setUnitsPerGrid(Number(event.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportScene}>
            Экспорт сцены (.json)
          </button>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            Импорт сцены (.json)
          </button>
          <input
            ref={sceneFileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </div>

      <div className="section">
        <h3>Кампании</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <button className="btn" onClick={handleCreateCampaign}>
            Новая кампания
          </button>
          <button className="btn btn-secondary" onClick={handleCampaignImportClick}>
            Импорт кампании (.json)
          </button>
          <input
            ref={campaignFileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleCampaignImport}
          />
          {activeCampaignId && (
            <button className="btn" onClick={() => handleSaveSceneToCampaign(activeCampaignId)}>
              Сохранить сцену в кампанию
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {campaigns.map((campaign) => (
            <div key={campaign.id} className={`campaign-card${campaign.id === activeCampaignId ? ' campaign-card--active' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{campaign.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {campaign.scenes.length} сцен · {campaign.id === activeCampaignId ? 'активна' : 'не активна'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setActiveCampaign(campaign.id)}>
                    Активировать
                  </button>
                  <button className="btn btn-secondary" onClick={() => duplicateCampaign(campaign.id)}>
                    Дублировать
                  </button>
                  <button className="btn btn-secondary" onClick={() => exportCampaign(campaign.id)}>
                    Экспорт
                  </button>
                  <button className="btn btn-secondary" onClick={() => deleteCampaign(campaign.id)}>
                    Удалить
                  </button>
                  <button className="btn" onClick={() => handleSaveSceneToCampaign(campaign.id)}>
                    Сохранить сюда
                  </button>
                </div>
              </div>
              {!!campaign.scenes.length && (
                <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                  {campaign.scenes.map((storedScene) => (
                    <button
                      key={storedScene.id}
                      className={`btn btn-secondary btn-small${storedScene.id === lastSceneId ? ' is-last' : ''}`}
                      onClick={() => handleLoadScene(campaign.id, storedScene.id)}
                    >
                      {storedScene.name || 'Без названия'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!campaigns.length && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Кампаний пока нет. Создайте новую, чтобы сохранять и переключать сцены.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenePanel;
