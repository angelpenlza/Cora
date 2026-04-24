import { ResourceCard } from './resource-card';
import '@/app/styles/resources-page.css';
import { COMMUNITY_RESOURCES } from './resources-data';

/**
 * Community resources for Orange County — external links, phones, and category badges.
 */
export default function ResourcesPage() {
  return (
    <div className="resources-page">
      <div className="resources-page__inner">
        <header className="resources-page__header">
          <h1 className="resources-page__title">
            Community{' '}
            <span className="resources-page__title-accent">Resources</span>
          </h1>
          <p className="resources-page__intro">
            Helpful links for Orange County residents to take action, report
            issues, and find support. We bridge the gap between community
            members and essential county services.
          </p>
        </header>

        <ul className="resources-page__grid">
          {COMMUNITY_RESOURCES.map((resource) => (
            <li key={resource.id}>
              <ResourceCard resource={resource} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
