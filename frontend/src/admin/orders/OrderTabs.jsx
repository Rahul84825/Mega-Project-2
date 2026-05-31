import { ORDER_TABS } from "./orderUtils";

const OrderTabs = ({ activeTab, counts, onSelect }) => {
  return (
    <div className="flex overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap gap-2 sm:pb-0 custom-scrollbar no-scrollbar">
      {ORDER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id] || 0;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all
              ${isActive
                ? "bg-[#8b4513] text-white border-[#8b4513] shadow-sm"
                : "bg-[#fffaf3] text-[#6d4c41] border-[#e6d3b3] hover:bg-[#f5e6d3]"
              }`}
          >
            <span>{tab.label}</span>
            <span className={`min-w-[26px] rounded-full px-2 py-0.5 text-[11px] ${isActive ? "bg-white/20" : "bg-[#f5e6d3]"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OrderTabs;
