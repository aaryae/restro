import Loader from "@/components/Loader";

interface PageContentProps {
  loading?: boolean;
  children: any;
}

const PageContent = ({ loading, children }: PageContentProps) => {
  if (loading) {
    return <Loader />;
  }

  return <div className="mb-5 rounded-2xl p-4">{children}</div>;
};

export default PageContent;
