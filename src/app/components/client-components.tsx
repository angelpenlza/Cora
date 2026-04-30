'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import { deleteReport } from "./actions"
import Link from "next/link"
import { DEFAULT_AVATAR_URL, normalizeAvatarUrl } from "@/lib/avatar-url";

/**
 * Small dismissible error banner component.
 *
 * Props:
 * - `message`: string to display; when falsy, nothing is rendered.
 *
 * Note: state is local only. If an error is passed via query string and the
 * page reloads with the same URL, the banner will reappear (by design).
 */
export function Err({ message }: any) {
  const [show, setShow] = useState(true)
  const dismiss = () => { setShow(false) }
  return (
    message && show ?
      <div className="error">
        Error: {message}
        <div onClick={dismiss}>X</div>
      </div> : <></>
  )
}

/*---------------------
<Reports /> 
displays a set of given reports (with images)

Input
- reports: an array of reports to display (can get from supabase and pass directly)
- images: an array of the reports' images (can get from cloudflare and pass directly)
- inAccount: boolean value, if true, will display a delete button with each report
---------------------*/
export function Reports({ reports, images, inAccount }: any | null) {
  if (!reports?.length) {
    return <div className="report-container">No reports</div>;
  }
  if (!images) {
    return <div className="report-container">Error getting reports</div>;
  }

  const ReportContainer = ({
    children,
    rid,
  }: {
    children: React.ReactNode;
    rid: string;
  }) => {
    return inAccount ? (
      <div className="report">{children}</div>
    ) : (
      <Link href={`/pages/user-report?report=${rid}`} className="report">
        {children}
      </Link>
    );
  };

  const formattedReports = reports.map((report: any) => {
    const url = images[report.report_id + '-' + report.report_image];
    return (
        <ReportContainer key={report.report_id} rid={report.report_id}>
          <div className="report-header">
            <h2 className="report-category">{report.category}</h2>
            <div className={report.status}>{report.status}</div>
          </div>
          <h3 className="report-title">{report.report_title}</h3>
          <p className="report-desc">{report.report_description}</p>

          {
            inAccount ? 
            <form>
              <input type="hidden" name="rid" value={report.report_id}/>
              <button formAction={(e) => {
                const confirm = window.confirm('delete post?');
                if(confirm) { 
                  console.log('e: ', e)
                  deleteReport(e) 
                } 
              }} className="report-delete">
                delete
              </button>
            </form> : 
            <div className="report-details">
              <Image 
                src={url || '/assets/user.png'}
                alt="usr-img"
                width={100}
                height={100}
                className="report-image"
              /> 
              <div className="report-dates">
                <div>{report.updated_at}</div>
                <div>{report.address}</div>
              </div>
              <div className="votes">
                <div>upvotes</div>
                <div>downvotes</div>
              </div>
            </div>
          }
        </ReportContainer>
    );
  });

  return <div className="report-container">{formattedReports}</div>;
}

/*---------------------
<Dropdown />
- a provides a dropdown menu for a form

Input
- array of options as strings
- the function to update the state
- category of type string to show the current category
---------------------*/
export function Dropdown({ options, update, category }: {
  options: string[], 
  update: Function,
  category: string
}) {
  const [showOptions, setShowOptions] = useState(false);

  const toggle = () => {
    if(showOptions) setShowOptions(false)
    else setShowOptions(true)
  }

  const selectOption = (category: string) => {
    update(category);
    setShowOptions(false);
  }

  const categories = options.map((option) => {
    return (
      <div 
        key={option} 
        onClick={() => selectOption(option)}
        className="dropdown-menu-item"
      >
        {option}
      </div>
    )
  })
  
  return (
    <div className="category-container">
      <div onClick={toggle} className="upload-input">
        {
          category.length <= 0 ? 
          <div className="pre-select">Select a category.</div> :
          <div className="post pre-select">{category}</div>
        } 
      </div>
      {
        showOptions ? 
        <div className="dropdown-menu-container">
          {categories}
        </div> : <></>
      }
    </div>
  )

}

/*---------------------
<Avatar />
- shows the user's avatar
- input the src link or null
- outputs a formatted avatar with provided src link
- or a default user avatar if null is provided
---------------------*/
export function Avatar({
  avatar_url,
  className,
}: {
  avatar_url: string | null;
  className?: string;
}) {
  const safeAvatarUrl = normalizeAvatarUrl(avatar_url);
  const photoClass = `pfp cora-user-avatar-photo${className ? ` ${className}` : ""}`;

  const [src, setSrc] = useState<string>(safeAvatarUrl ?? DEFAULT_AVATAR_URL);
  useEffect(() => {
    setSrc(safeAvatarUrl ?? DEFAULT_AVATAR_URL);
  }, [safeAvatarUrl]);

  return (
    <img
      src={src}
      alt=""
      width={100}
      height={100}
      className={photoClass}
      referrerPolicy="no-referrer"
      onError={() => {
        setSrc((prev) => {
          if (prev !== DEFAULT_AVATAR_URL) return DEFAULT_AVATAR_URL;
          return prev;
        });
      }}
    />
  );
}