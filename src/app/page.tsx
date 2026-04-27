'use server'

import Image from "next/image";
import Link from "next/link";
import './styles/home.css';
import { createClient } from "@/lib/supabase/server";
 
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <section className="home-landing" aria-labelledby="home-landing-title">
      <div className="home-landing__inner">
        <div className="home-landing__content">
          <h1 id="home-landing-title" className="home-landing__title">
            Help keep everyone in your community
            <span className="home-landing__title--accent"> alert and informed.</span>
          </h1>
          <p className="home-landing__description">
            Our mission is to empower Orange County residents with real-time safety updates and a
            collaborative platform to protect our neighborhoods together.
          </p>

          <div className="home-landing__actions">
            {
              data.user?.role === 'authenticated' ?
              <Link href="/pages/reports" className="home-landing__button home-landing__button--signup">
                Reports
              </Link> :
              <Link href='/pages/signup' className="home-landing__button home-landing__button--signup">
                Sign Up
              </Link>
            }
            <Link href="/pages/interactive-map" className="home-landing__button home-landing__button--explore">
              Explore Map
            </Link>
          </div>
        </div>

        <div className="home-landing__media">
          <Image
            src="/assets/landing-page-hero.png"
            alt="Aerial neighborhood view"
            width={960}
            height={640}
            className="home-landing__image"
            priority
          />
        </div>
      </div>
    </section>
  );
}
