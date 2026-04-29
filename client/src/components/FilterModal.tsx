import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export interface FilterValues {
  maxPrice: number;
  minRating: number;
  maxDistance: number;
  availableOnly: boolean;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  initial: FilterValues;
  onApply: (v: FilterValues) => void;
}

const FilterModal = ({ open, onClose, initial, onApply }: FilterModalProps) => {
  const [v, setV] = useState<FilterValues>(initial);

  const reset = () => setV({ maxPrice: 500, minRating: 0, maxDistance: 10, availableOnly: false });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Price */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">Max Price</label>
              <span className="text-xs font-bold text-primary">₹{v.maxPrice}/hr</span>
            </div>
            <input
              type="range" min={100} max={500} step={50}
              value={v.maxPrice}
              onChange={(e) => setV({ ...v, maxPrice: +e.target.value })}
              className="w-full accent-primary"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Minimum Rating</label>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setV({ ...v, minRating: r })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    v.minRating === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-input border-border text-muted-foreground"
                  }`}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">Max Distance</label>
              <span className="text-xs font-bold text-primary">{v.maxDistance} km</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={v.maxDistance}
              onChange={(e) => setV({ ...v, maxDistance: +e.target.value })}
              className="w-full accent-primary"
            />
          </div>

          {/* Availability */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-semibold text-foreground">Available now only</span>
            <input
              type="checkbox"
              checked={v.availableOnly}
              onChange={(e) => setV({ ...v, availableOnly: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl bg-input border border-border text-sm font-semibold text-foreground"
          >
            Reset
          </button>
          <button
            onClick={() => { onApply(v); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
