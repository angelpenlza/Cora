import { getImages } from "@/app/components/cfhelpers";
import { Reports } from "@/app/components/client-components";
import { createClient } from "@/lib/supabase/server";

export default async function Explore() {
    const supabase = await createClient();
    const { data: reports } = await supabase.from('reports').select();
    const images = await getImages();

    return (
      <div>
        <h1>Reports and complaints</h1>
        <Reports reports={reports} images={images}/>
      </div>
    )
}