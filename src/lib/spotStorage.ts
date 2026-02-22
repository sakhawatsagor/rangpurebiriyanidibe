import { BiryaniSpot } from "@/types/spot";
import { supabase } from "./supabase";

const USE_SUPABASE =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============ Load Spots ============
export async function loadSpots(): Promise<BiryaniSpot[] | null> {
  if (!USE_SUPABASE) return null;

  try {
    const { data, error } = await supabase
      .from("biryani_spots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load error:", error);
      return null;
    }

    return data.map((s: any) => ({
      ...s,
      createdAt: new Date(s.created_at),
    }));
  } catch (e) {
    console.error("Failed to load spots", e);
    return null;
  }
}

// ============ Add Spot ============
export async function addSpot(
  spot: Omit<BiryaniSpot, "id" | "createdAt">
): Promise<BiryaniSpot | null> {

  const newSpot = {
    id: Date.now().toString(),
    name: spot.name,
    address: spot.address,
    description: spot.description,
    addedBy: spot.addedBy,
    lat: spot.lat,
    ing: spot.lng, // ⚠️ because DB column is "ing"
    isActive: spot.isActive,
    rating: spot.rating,
    likes: spot.likes ?? 0,
    dislikes: spot.dislikes ?? 0,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("biryani_spots")
      .insert([newSpot])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return null;
    }

    return {
      ...data,
      lng: data.ing, // convert back to lng for frontend
      createdAt: new Date(data.created_at),
    };

  } catch (e) {
    console.error("Failed to add spot", e);
    return null;
  }
}

// ============ Update Spot ============
export async function updateSpot(
  id: string,
  updates: Partial<BiryaniSpot>
): Promise<boolean> {

  const dbUpdates: any = { ...updates };

  if ("lng" in dbUpdates) {
    dbUpdates.ing = dbUpdates.lng;
    delete dbUpdates.lng;
  }

  if ("createdAt" in dbUpdates) {
    dbUpdates.created_at = dbUpdates.createdAt;
    delete dbUpdates.createdAt;
  }

  try {
    const { error } = await supabase
      .from("biryani_spots")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return false;
    }

    return true;

  } catch (e) {
    console.error("Failed to update spot", e);
    return false;
  }
}