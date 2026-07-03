import AdminUsersPanel from "../components/AdminUsersPanel.jsx";
import { NoUsersEmpty } from "../components/EmptyState.jsx";

export default function UsersPage({ users, history, userSummary, handleDeleteUser }) {
  const hasUsers = Object.keys(users).length > 0 || Object.keys(history).length > 0;
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              👥 Manage Users
            </h2>
            <div className="text-sm text-slate-500">Manage user accounts and permissions.</div>
          </div>
          <div className="text-sm text-slate-500">
            {Object.keys(users).length} users registered
          </div>
        </div>
      </div>
      
      {hasUsers ? (
        <AdminUsersPanel
          users={users}
          history={history}
          userSummary={userSummary}
          onDeleteUser={handleDeleteUser}
        />
      ) : (
        <NoUsersEmpty 
          onRegister={() => window.location.href = "/"}
        />
      )}
    </div>
  );
}
