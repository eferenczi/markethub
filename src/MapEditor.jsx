import React, { useEffect, useRef, useState } from "react";
import {
  Grip,
  ImagePlus,
  Loader2,
  MapPinned,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import { api } from "./api";
import { C } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const cleanSpots = (spots) =>
  spots.map(
    (
      {
        vendor_id: _vendor,
        id: _id,
        layout_id: _layout,
        template_id: _template,
        ...spot
      },
      index,
    ) => ({ ...spot, sort_order: index }),
  );

function SpotArtwork({ spot }) {
  if (spot.kind === "truck")
    return (
      <div className="absolute inset-0">
        <div
          style={{ background: C.honey }}
          className="absolute left-[4%] top-[15%] w-[73%] h-[62%] rounded-sm border-2 border-white/70"
        />
        <div
          style={{ background: C.honeyDeep }}
          className="absolute right-[3%] top-[28%] w-[26%] h-[49%] rounded-r-md border-2 border-white/70"
        />
        <span className="absolute right-[8%] top-[37%] w-[12%] h-[15%] bg-sky-100 rounded-sm" />
        <span className="absolute left-[14%] bottom-[6%] w-[15%] h-[15%] rounded-full bg-slate-800 border border-white" />
        <span className="absolute right-[15%] bottom-[6%] w-[15%] h-[15%] rounded-full bg-slate-800 border border-white" />
      </div>
    );
  return (
    <div className="absolute inset-0">
      <div
        style={{
          background:
            "repeating-linear-gradient(135deg, #f9d876 0 8px, #fff7d8 8px 16px)",
          clipPath: "polygon(50% 3%, 97% 43%, 87% 62%, 13% 62%, 3% 43%)",
        }}
        className="absolute inset-x-[1%] top-[1%] h-[68%] border border-white/80"
      />
      <span className="absolute left-[17%] top-[55%] h-[38%] border-l-2 border-white" />
      <span className="absolute right-[17%] top-[55%] h-[38%] border-l-2 border-white" />
    </div>
  );
}

export default function MapEditor({
  dateId,
  marketId,
  vendors,
  canWrite,
  notify,
}) {
  const [layout, setLayout] = useState(null);
  const [spots, setSpots] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [templateId, setTemplateId] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const uploadRef = useRef(null);
  const selectedTemplate = templates?.find(
    (item) => String(item.id) === String(templateId),
  );
  const load = async () => {
    try {
      const [layoutResult, templateResult] = await Promise.all([
        api.getLayouts(dateId),
        api.getLayoutTemplates(marketId),
      ]);
      const current = layoutResult.layouts[0] || null;
      setLayout(current);
      setSpots(current?.spots || []);
      setTemplates(templateResult.templates);
      setTemplateId(String(templateResult.templates[0]?.id || ""));
    } catch (error) {
      notify(error.message, "err");
    }
  };
  useEffect(() => {
    setLayout(null);
    setSpots([]);
    setTemplates(null);
    load();
  }, [dateId, marketId]);
  useEffect(() => {
    const move = (event) => {
      if (!drag.current || !stageRef.current) return;
      const { index, mode, start, x, y, width, height } = drag.current;
      const bounds = stageRef.current.getBoundingClientRect();
      const dx = ((event.clientX - x) / bounds.width) * 100;
      const dy = ((event.clientY - y) / bounds.height) * 100;
      setSpots((current) =>
        current.map((spot, i) => {
          if (i !== index) return spot;
          if (mode === "move")
            return {
              ...spot,
              x: Math.max(
                0,
                Math.min(100 - Number(spot.width), Number(start.x) + dx),
              ),
              y: Math.max(
                0,
                Math.min(100 - Number(spot.height), Number(start.y) + dy),
              ),
            };
          const left = mode.includes("w");
          const top = mode.includes("n");
          let nextX = Number(start.x);
          let nextY = Number(start.y);
          let nextWidth = Number(width) + (left ? -dx : dx);
          let nextHeight = Number(height) + (top ? -dy : dy);
          if (left) nextX = Number(start.x) + dx;
          if (top) nextY = Number(start.y) + dy;
          if (nextWidth < 0.1) {
            if (left) nextX -= 0.1 - nextWidth;
            nextWidth = 0.1;
          }
          if (nextHeight < 0.1) {
            if (top) nextY -= 0.1 - nextHeight;
            nextHeight = 0.1;
          }
          if (nextX < 0) {
            nextWidth += nextX;
            nextX = 0;
          }
          if (nextY < 0) {
            nextHeight += nextY;
            nextY = 0;
          }
          nextWidth = Math.max(0.1, Math.min(nextWidth, 100 - nextX));
          nextHeight = Math.max(0.1, Math.min(nextHeight, 100 - nextY));
          return {
            ...spot,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          };
        }),
      );
    };
    const up = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  useEffect(() => {
    const removeSelected = (event) => {
      if (event.key !== "Delete" || selectedIndex == null) return;
      const tag = event.target?.tagName;
      if (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag) ||
        event.target?.isContentEditable
      )
        return;
      event.preventDefault();
      setSpots((current) =>
        current.filter((_, index) => index !== selectedIndex),
      );
      setSelectedIndex(null);
    };
    window.addEventListener("keydown", removeSelected);
    return () => window.removeEventListener("keydown", removeSelected);
  }, [selectedIndex]);
  const begin = (event, index, mode) => {
    if (!canWrite || (event.pointerType === "mouse" && event.button !== 0))
      return;
    event.preventDefault();
    event.stopPropagation();
    const spot = spots[index];
    drag.current = {
      index,
      mode,
      start: { x: Number(spot.x), y: Number(spot.y) },
      width: Number(spot.width),
      height: Number(spot.height),
      x: event.clientX,
      y: event.clientY,
    };
  };
  const patch = (index, change) =>
    setSpots((current) =>
      current.map((spot, i) => (i === index ? { ...spot, ...change } : spot)),
    );
  const duplicate = () => {
    if (selectedIndex == null) return;
    setSpots((current) => {
      const source = current[selectedIndex];
      const number =
        current.filter((spot) => spot.kind === source.kind).length + 1;
      const clone = {
        ...source,
        code: `${source.kind === "truck" ? "F" : "B"}${number}`,
        vendor_id: null,
        x: Math.min(100 - Number(source.width), Number(source.x) + 3),
        y: Math.min(100 - Number(source.height), Number(source.y) + 3),
        sort_order: current.length,
      };
      setSelectedIndex(current.length);
      return [...current, clone];
    });
  };
  const addSpot = (kind) =>
    setSpots((current) => [
      ...current,
      {
        code: `${kind === "truck" ? "F" : "B"}${current.filter((item) => item.kind === kind).length + 1}`,
        kind,
        vendor_id: null,
        x: 10 + (current.length % 5) * 16,
        y: 12 + (Math.floor(current.length / 5) % 4) * 18,
        width: kind === "truck" ? 17 : 10,
        height: kind === "truck" ? 10 : 8,
        rotation: 0,
        sort_order: current.length,
      },
    ]);
  const saveEvent = async () => {
    if (!layout?.venue_image)
      return notify("Upload or apply a market map first", "err");
    setSaving(true);
    try {
      const body = {
        venue_image: layout.venue_image,
        spots: cleanSpots(spots),
      };
      const result = layout.id
        ? await api.updateLayout(layout.id, body)
        : await api.createLayout({
            market_date_id: Number(dateId),
            name: "Floor plan",
            ...body,
          });
      setLayout(result.layout);
      setSpots(result.layout.spots);
      notify("This event’s map is saved");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSaving(false);
    }
  };
  const saveTemplate = async () => {
    if (!layout?.venue_image)
      return notify("Upload or apply a market map first", "err");
    setSaving(true);
    try {
      const body = {
        name: selectedTemplate?.name || "Default venue map",
        venue_image: layout.venue_image,
        spots: cleanSpots(spots),
      };
      const result = selectedTemplate
        ? await api.updateLayoutTemplate(selectedTemplate.id, body)
        : await api.createLayoutTemplate({
            market_id: Number(marketId),
            ...body,
          });
      const next = selectedTemplate ? result.template : result.template;
      setTemplates((current) =>
        selectedTemplate
          ? current.map((item) => (item.id === next.id ? next : item))
          : [next, ...(current || [])],
      );
      setTemplateId(String(next.id));
      notify("Saved as this market’s reusable template");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSaving(false);
    }
  };
  const applyTemplate = async () => {
    if (!templateId) return notify("Choose a market template", "err");
    setSaving(true);
    try {
      const result = await api.applyLayoutTemplate(templateId, Number(dateId));
      setLayout(result.layout);
      setSpots(result.layout.spots);
      notify("Template applied to this event—assign vendors when ready");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSaving(false);
    }
  };
  const readImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return notify("Choose an image file", "err");
    if (file.size > 3_000_000)
      return notify("Map image must be 3 MB or smaller", "err");
    setSaving(true);
    try {
      const venue_image = await readImage(file);
      const body = {
        name: selectedTemplate?.name || "Default venue map",
        venue_image,
        spots: cleanSpots(spots),
      };
      const result = selectedTemplate
        ? await api.updateLayoutTemplate(selectedTemplate.id, body)
        : await api.createLayoutTemplate({
            market_id: Number(marketId),
            ...body,
          });
      const template = result.template;
      setTemplates((current) =>
        selectedTemplate
          ? current.map((item) => (item.id === template.id ? template : item))
          : [template, ...(current || [])],
      );
      setTemplateId(String(template.id));
      const applied = await api.applyLayoutTemplate(
        template.id,
        Number(dateId),
      );
      setLayout(applied.layout);
      setSpots(applied.layout.spots);
      notify("Map uploaded and saved as a reusable market template");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSaving(false);
    }
  };
  if (!templates)
    return (
      <div style={{ color: C.sub }} className="text-[13px] py-7">
        <Loader2 size={15} className="inline animate-spin mr-2" />
        Loading map tools…
      </div>
    );
  const selected = selectedIndex == null ? null : spots[selectedIndex];
  return (
    <div className="flex flex-col gap-3">
      <section
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-4"
      >
        <div className="flex flex-wrap gap-2 items-center">
          <label
            style={{ background: C.paper2, color: C.ink }}
            className="px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer flex items-center gap-1"
          >
            <ImagePlus size={14} /> Upload / replace map
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={upload}
            />
          </label>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            style={inp}
            className="min-w-44 px-3 py-2 rounded-lg text-[12px] outline-none"
          >
            <option value="">New default template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {canWrite && (
            <button
              onClick={applyTemplate}
              disabled={!templateId || saving}
              style={{ background: C.sageSoft, color: C.pine }}
              className="px-3 py-2 rounded-lg text-[12px] font-bold"
            >
              Use template for event
            </button>
          )}
        </div>
        <p style={{ color: C.sub }} className="mt-2 text-[11.5px]">
          Drag any canopy or truck where you want it. Each of the four white
          corner handles independently changes both its width and height. Update
          the reusable template whenever the venue changes.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {canWrite && (
            <>
              <button
                onClick={() => addSpot("tent")}
                style={{ background: C.sageSoft, color: C.pine }}
                className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
              >
                <Plus size={13} /> 10×10 canopy
              </button>
              <button
                onClick={() => addSpot("truck")}
                style={{ background: C.honeySoft, color: C.honeyDeep }}
                className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
              >
                <Truck size={13} /> Food truck
              </button>
              <button
                onClick={saveEvent}
                disabled={saving}
                style={{ background: C.pine, color: "#fff" }}
                className="ml-auto px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
              >
                <Save size={13} /> Save event map
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                style={{ background: C.berrySoft, color: C.berry }}
                className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
              >
                <Save size={13} /> Update future template
              </button>
            </>
          )}
        </div>
        {selected && (
          <div
            style={{ background: C.paper2 }}
            className="mt-3 rounded-xl p-3 flex flex-wrap gap-2 items-center"
          >
            <span className="text-[12px] font-bold">
              Selected {selected.code}
            </span>
            <select
              value={selected.vendor_id || ""}
              onChange={(event) =>
                patch(selectedIndex, {
                  vendor_id: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              style={inp}
              className="min-w-40 px-2 py-1.5 rounded-lg text-[12px]"
            >
              <option value="">Assign vendor…</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.business_name}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                patch(selectedIndex, {
                  rotation: (Number(selected.rotation || 0) + 345) % 360,
                })
              }
              style={{ background: C.card, color: C.ink }}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1"
            >
              <RotateCcw size={13} /> 15°
            </button>
            <span style={{ color: C.sub }} className="text-[11.5px]">
              {Math.round(Number(selected.rotation || 0))}°
            </span>
            <button
              onClick={() =>
                patch(selectedIndex, {
                  rotation: (Number(selected.rotation || 0) + 15) % 360,
                })
              }
              style={{ background: C.card, color: C.ink }}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1"
            >
              15° <RotateCw size={13} />
            </button>
            <button
              onClick={duplicate}
              style={{ background: C.card, color: C.pine }}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1"
            >
              <Plus size={13} /> Duplicate
            </button>
          </div>
        )}
      </section>
      <div
        ref={stageRef}
        style={{
          background: C.paper2,
          minHeight: 480,
          touchAction: "none",
          backgroundImage: layout?.venue_image
            ? `url(${layout.venue_image})`
            : "none",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
        className="rounded-2xl relative overflow-hidden border border-[#DED9CC]"
      >
        {!layout?.venue_image && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div>
              <MapPinned size={38} color={C.faint} className="mx-auto mb-2" />
              <p style={{ color: C.sub }} className="text-[13px]">
                Upload a venue map once, then it will be ready as a template for
                every future date at this market.
              </p>
            </div>
          </div>
        )}
        {spots.map((spot, index) => (
          <div
            key={`${spot.code}-${index}`}
            onPointerDown={(event) => {
              setSelectedIndex(index);
              begin(event, index, "move");
            }}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.width}%`,
              height: `${spot.height}%`,
              transform: `rotate(${spot.rotation || 0}deg)`,
              cursor: canWrite ? "grab" : "default",
              outline:
                selectedIndex === index ? `2px solid ${C.berry}` : "none",
            }}
            className="absolute shadow-lg select-none"
          >
            <SpotArtwork spot={spot} />
            <div className="absolute left-1 top-1 text-[10px] font-bold text-slate-900 bg-white/80 rounded px-1 flex items-center gap-0.5">
              <Grip size={10} /> {spot.code}
            </div>
            {canWrite && (
              <>
                <button
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    setSpots((current) =>
                      current.filter((_, i) => i !== index),
                    );
                    setSelectedIndex(null);
                  }}
                  className="absolute -right-1.5 -top-1.5 w-4 h-4 rounded-full bg-white text-red-700 shadow flex items-center justify-center"
                >
                  <Trash2 size={9} />
                </button>
                <span
                  onPointerDown={(event) => begin(event, index, "resize-nw")}
                  style={{ cursor: "nwse-resize" }}
                  className="absolute -left-2 -top-2 w-4 h-4 bg-white border-2 border-slate-500 rounded-full shadow"
                />
                <span
                  onPointerDown={(event) => begin(event, index, "resize-ne")}
                  style={{ cursor: "nesw-resize" }}
                  className="absolute -right-2 -top-2 w-4 h-4 bg-white border-2 border-slate-500 rounded-full shadow"
                />
                <span
                  onPointerDown={(event) => begin(event, index, "resize-sw")}
                  style={{ cursor: "nesw-resize" }}
                  className="absolute -left-2 -bottom-2 w-4 h-4 bg-white border-2 border-slate-500 rounded-full shadow"
                />
                <span
                  onPointerDown={(event) => begin(event, index, "resize-se")}
                  style={{ cursor: "nwse-resize" }}
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border-2 border-slate-500 rounded-full shadow"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
