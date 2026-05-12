import { useState } from 'react';
import { User, Camera, Pencil, Trash2, RotateCcw } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[38px] h-[22px] rounded-full transition-colors duration-150 flex-shrink-0 cursor-pointer ${
        checked ? 'bg-[#6366F1]' : 'bg-[#E2E8F0]'
      }`}
    >
      <span
        className={`absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-[left] duration-150 ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === opt
              ? 'bg-white text-[#0F172A] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ sessions, onClearSessions }) {
  const [units, setUnits] = useState('Metric (°C, km)');
  const [currency, setCurrency] = useState('USD');
  const [pace, setPace] = useState('Balanced');
  const [budget, setBudget] = useState('$$');
  const [departure, setDeparture] = useState('');
  const [emailDigest, setEmailDigest] = useState(true);
  const [browserPush, setBrowserPush] = useState(true);
  const [weeklyInspiration, setWeeklyInspiration] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-[18px]">
        <h1 className="text-[22px] font-bold text-[#0F172A] tracking-[-0.015em]">Settings</h1>
        <p className="text-[13.5px] text-[#64748B] mt-1">Account, preferences, and API keys for Whether.</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] px-8 py-7 flex flex-col gap-6">

          {/* Profile Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[15px] font-semibold">Profile</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Visible to no one — Whether is single-player.</p>
            </div>
            <div className="px-5 py-[18px]">
              <div className="flex items-center gap-[18px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-semibold">Traveler</div>
                  <div className="text-[13px] text-[#64748B] mt-0.5">traveler@example.com</div>
                  <div className="flex gap-2 mt-2.5">
                    <button className="text-[12.5px] font-medium px-3 py-[7px] rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Change photo
                    </button>
                    <button className="text-[12.5px] font-medium px-3 py-[7px] rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit name
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Preferences Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[15px] font-semibold">Trip preferences</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Defaults applied to every new plan.</p>
            </div>
            <div className="px-5 py-[18px] flex flex-col gap-3.5">
              <div className="grid grid-cols-[160px_1fr] gap-[18px] items-center">
                <label className="text-[13px] font-medium text-[#0F172A]">Default departure</label>
                <input
                  type="text"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#0F172A] bg-white outline-none focus:ring-2 focus:ring-[#6366F1]/25 focus:border-transparent transition-all placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-[18px] items-center">
                <label className="text-[13px] font-medium text-[#0F172A]">Units</label>
                <SegmentedControl
                  options={['Metric (°C, km)', 'Imperial (°F, mi)']}
                  value={units}
                  onChange={setUnits}
                />
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-[18px] items-center">
                <label className="text-[13px] font-medium text-[#0F172A]">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#0F172A] bg-white outline-none focus:ring-2 focus:ring-[#6366F1]/25 focus:border-transparent transition-all"
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="CNY">CNY — Chinese Yuan</option>
                </select>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-[18px] items-center">
                <label className="text-[13px] font-medium text-[#0F172A]">Pace</label>
                <SegmentedControl
                  options={['Relaxed', 'Balanced', 'Packed']}
                  value={pace}
                  onChange={setPace}
                />
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-[18px] items-center">
                <label className="text-[13px] font-medium text-[#0F172A]">Budget tier</label>
                <SegmentedControl
                  options={['$', '$$', '$$$', '$$$$']}
                  value={budget}
                  onChange={setBudget}
                />
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[15px] font-semibold">Notifications</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Where Whether reaches you when a plan finishes streaming.</p>
            </div>
            <div className="px-5 py-[18px] flex flex-col gap-3.5">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Email digest</div>
                  <div className="text-xs text-[#64748B] mt-0.5 max-w-[380px]">A summary when a plan finishes, plus weather-change alerts close to your trip.</div>
                </div>
                <Toggle checked={emailDigest} onChange={setEmailDigest} />
              </div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Browser push</div>
                  <div className="text-xs text-[#64748B] mt-0.5 max-w-[380px]">Live status while a long plan is streaming.</div>
                </div>
                <Toggle checked={browserPush} onChange={setBrowserPush} />
              </div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Weekly inspiration</div>
                  <div className="text-xs text-[#64748B] mt-0.5 max-w-[380px]">One destination idea, no marketing.</div>
                </div>
                <Toggle checked={weeklyInspiration} onChange={setWeeklyInspiration} />
              </div>
            </div>
          </div>

          {/* API Keys Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[15px] font-semibold">API keys</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Whether reads from your own keys — they never leave this device.</p>
            </div>
            <div className="px-5 py-[18px] flex flex-col gap-3.5">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">
                    OpenWeather{' '}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] text-[11px] font-semibold font-mono tracking-wide">
                      connected
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">Used for real-time forecasts in <code className="text-[10px]">get_weather</code>.</div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-mono text-xs text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  ow_xxx•••••8f3a
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">
                    OpenAI{' '}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] text-[11px] font-semibold font-mono tracking-wide">
                      connected
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">Powers the planning agent and tool routing.</div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-mono text-xs text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  sk-•••••••••••J9k2
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#FECACA]">
              <h3 className="text-[15px] font-semibold text-[#991B1B]">Danger zone</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">These actions can't be undone.</p>
            </div>
            <div className="px-5 py-[18px] flex flex-col gap-3.5">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Clear all sessions</div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    Removes the {sessions?.length || 0} trip plan{sessions?.length !== 1 ? 's' : ''} in your sidebar.
                  </div>
                </div>
                <button
                  onClick={onClearSessions}
                  className="text-[12.5px] font-medium px-3 py-[7px] rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] hover:bg-red-100 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear sessions
                </button>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Reset preferences</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Revert units, pace, and budget to defaults.</div>
                </div>
                <button
                  onClick={() => {
                    setUnits('Metric (°C, km)');
                    setPace('Balanced');
                    setBudget('$$');
                    setCurrency('USD');
                    setDeparture('');
                  }}
                  className="text-[12.5px] font-medium px-3 py-[7px] rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] hover:bg-red-100 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
