import React, { useState } from 'react';
import { Legend, LegendClass, Weapon, WeaponType, AmmoType, ValorantAgent, ValorantRole } from '../../utils/catalogTypes';
import { uploadCatalogImage } from '../../utils/catalogService';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { X, Upload, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type ItemType = 'WEAPON' | 'LEGEND' | 'AGENT';

interface CatalogItemFormProps {
  type: ItemType;
  item?: Weapon | Legend | ValorantAgent | null;
  onSave: (item: any) => Promise<void>;
  onClose: () => void;
}

const WEAPON_TYPES: WeaponType[] = ['Assault Rifle', 'SMG', 'LMG', 'Marksman', 'Sniper', 'Shotgun', 'Pistol'];
const AMMO_TYPES: AmmoType[] = ['Energy', 'Heavy', 'Light', 'Sniper', 'Shotgun', 'Arrows', 'Mythic'];
const LEGEND_CLASSES: LegendClass[] = ['Assault', 'Skirmisher', 'Recon', 'Support', 'Controller'];
const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];

export const CatalogItemForm: React.FC<CatalogItemFormProps> = ({ type, item, onSave, onClose }) => {
  // Form states
  const [id, setId] = useState(item?.id || '');
  const [name, setName] = useState(item?.name || '');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  // Weapon specific
  const [weaponType, setWeaponType] = useState<WeaponType>(
    (item as Weapon)?.type || 'Assault Rifle'
  );
  const [ammoType, setAmmoType] = useState<AmmoType>(
    (item as Weapon)?.ammo || 'Light'
  );
  const [isCarePackage, setIsCarePackage] = useState<boolean>(
    (item as Weapon)?.isCarePackage || false
  );
  const [weaponImage, setWeaponImage] = useState<string>((item as Weapon)?.image || '');

  // Legend specific
  const [legendClass, setLegendClass] = useState<LegendClass>(
    (item as Legend)?.class || 'Assault'
  );
  const [cardImage, setCardImage] = useState<string>((item as Legend)?.image || '');
  const [portraitIcon, setPortraitIcon] = useState<string>((item as Legend)?.icon || '');

  // Agent specific
  const [agentRole, setAgentRole] = useState<ValorantRole>(
    (item as ValorantAgent)?.role || 'Duelist'
  );
  const [agentImage, setAgentImage] = useState<string>((item as ValorantAgent)?.image || '');

  // Uploading / Saving State
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(item);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetId = id.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'item';

    try {
      setUploadingField(fieldName);
      setError(null);

      let folder: 'apex_legends' | 'apex_weapons' | 'valorant_agents';
      if (type === 'WEAPON') folder = 'apex_weapons';
      else if (type === 'LEGEND') folder = 'apex_legends';
      else folder = 'valorant_agents';

      const publicUrl = await uploadCatalogImage(file, folder, targetId);

      if (fieldName === 'weaponImage') setWeaponImage(publicUrl);
      else if (fieldName === 'cardImage') setCardImage(publicUrl);
      else if (fieldName === 'portraitIcon') setPortraitIcon(publicUrl);
      else if (fieldName === 'agentImage') setAgentImage(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    const finalId = id.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    try {
      setSaving(true);
      setError(null);

      if (type === 'WEAPON') {
        if (!weaponImage) {
          setError('Weapon image is required.');
          return;
        }
        await onSave({
          id: finalId,
          name: name.trim(),
          type: weaponType,
          ammo: ammoType,
          image: weaponImage,
          isCarePackage,
          isActive
        });
      } else if (type === 'LEGEND') {
        if (!cardImage || !portraitIcon) {
          setError('Both Card Image and Portrait Icon are required for a Legend.');
          return;
        }
        await onSave({
          id: finalId,
          name: name.trim(),
          class: legendClass,
          image: cardImage,
          icon: portraitIcon,
          isActive
        });
      } else if (type === 'AGENT') {
        if (!agentImage) {
          setError('Agent image is required.');
          return;
        }
        await onSave({
          id: finalId,
          name: name.trim(),
          role: agentRole,
          image: agentImage,
          isActive
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div>
            <h2 className="text-xl font-black uppercase text-white tracking-wide">
              {isEditing ? 'Edit' : 'Add New'} {type === 'WEAPON' ? 'Apex Weapon' : type === 'LEGEND' ? 'Apex Legend' : 'VALORANT Agent'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Fill in details and upload high-res artwork</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                ID (Unique Slug)
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. nemesis or sparrow"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 disabled:opacity-50 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nemesis Burst AR"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Weapon Specific Fields */}
          {type === 'WEAPON' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Weapon Type
                  </label>
                  <select
                    value={weaponType}
                    onChange={(e) => setWeaponType(e.target.value as WeaponType)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    {WEAPON_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Ammo Type
                  </label>
                  <select
                    value={ammoType}
                    onChange={(e) => setAmmoType(e.target.value as AmmoType)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    {AMMO_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCarePackage}
                    onChange={(e) => setIsCarePackage(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-neutral-800 border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Care Package</span>
                    <p className="text-[10px] text-neutral-500">In supply drops (excluded from ground pool)</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-neutral-800 border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Active</span>
                    <p className="text-[10px] text-neutral-500">Available in game pool</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Weapon Image Artwork *
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {weaponImage ? (
                      <img src={resolveAssetUrl(weaponImage, 'weapons')} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingField === 'weaponImage' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-red-400" />
                      )}
                      <span>Upload Weapon Image (≤ 5MB)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'weaponImage')}
                      />
                    </label>
                    <input
                      type="text"
                      value={weaponImage}
                      onChange={(e) => setWeaponImage(e.target.value)}
                      placeholder="Or enter filename/URL"
                      className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Legend Specific Fields */}
          {type === 'LEGEND' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Class
                </label>
                <select
                  value={legendClass}
                  onChange={(e) => setLegendClass(e.target.value as LegendClass)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  {LEGEND_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-neutral-800 border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Active Legend</span>
                    <p className="text-[10px] text-neutral-500">Available to select in roulette</p>
                  </div>
                </label>
              </div>

              {/* Card Image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Card Image (Full Body) *
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {cardImage ? (
                      <img src={resolveAssetUrl(cardImage, 'legends')} alt="Card" className="w-full h-full object-cover object-top" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingField === 'cardImage' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-red-400" />
                      )}
                      <span>Upload Card Image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'cardImage')}
                      />
                    </label>
                    <input
                      type="text"
                      value={cardImage}
                      onChange={(e) => setCardImage(e.target.value)}
                      placeholder="Or enter filename/URL"
                      className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300"
                    />
                  </div>
                </div>
              </div>

              {/* Portrait Icon */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Portrait Icon (Square for Pool list) *
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {portraitIcon ? (
                      <img src={resolveAssetUrl(portraitIcon, 'icons')} alt="Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingField === 'portraitIcon' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-red-400" />
                      )}
                      <span>Upload Portrait Icon</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'portraitIcon')}
                      />
                    </label>
                    <input
                      type="text"
                      value={portraitIcon}
                      onChange={(e) => setPortraitIcon(e.target.value)}
                      placeholder="Or enter filename/URL"
                      className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VALORANT Agent Specific Fields */}
          {type === 'AGENT' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Agent Role
                </label>
                <select
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value as ValorantRole)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  {VALORANT_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-neutral-800 border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Active Agent</span>
                    <p className="text-[10px] text-neutral-500">Available to assign in Valorant lobby</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Agent Artwork *
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {agentImage ? (
                      <img src={resolveAssetUrl(agentImage)} alt="Agent" className="w-full h-full object-cover object-top" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingField === 'agentImage' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-red-400" />
                      )}
                      <span>Upload Agent Artwork</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'agentImage')}
                      />
                    </label>
                    <input
                      type="text"
                      value={agentImage}
                      onChange={(e) => setAgentImage(e.target.value)}
                      placeholder="Or enter filename/URL"
                      className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(uploadingField)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Item</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
