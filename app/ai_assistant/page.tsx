import ChatUI from "@/components/ChatUI";
import ProtectedPage from "@/components/ProtectedPage";

export default function Page() {
  return (
    <ProtectedPage>
      <ChatUI />
    </ProtectedPage>
  );
}
