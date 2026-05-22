import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminAuditEntry } from "@/lib/admin-data";

function actionLabel(action: AdminAuditEntry["action"]) {
  switch (action) {
    case "user_banned":
      return "Kullanıcı banlandı";
    case "user_unbanned":
      return "Ban kaldırıldı";
    case "content_deleted":
      return "İçerik silindi";
    case "content_restored":
      return "İçerik geri yüklendi";
    case "pin_verified":
      return "Pin doğrulandı";
    case "pin_rejected":
      return "Pin reddedildi";
    case "config_changed":
      return "Yapılandırma";
    case "report_resolved":
      return "Şikayet çözüldü";
    default:
      return action;
  }
}

function actionTone(action: AdminAuditEntry["action"]) {
  switch (action) {
    case "user_banned":
    case "content_deleted":
    case "pin_rejected":
      return "error" as const;
    case "content_restored":
      return "info" as const;
    case "report_resolved":
    case "config_changed":
      return "warning" as const;
    case "pin_verified":
    case "user_unbanned":
      return "success" as const;
    default:
      return "default" as const;
  }
}

function roleTone(role: AdminAuditEntry["actorRole"]) {
  switch (role) {
    case "admin":
      return "error" as const;
    case "moderator":
      return "info" as const;
    case "user":
      return "default" as const;
    default:
      return "warning" as const;
  }
}

function targetLabel(targetType: AdminAuditEntry["targetType"]) {
  switch (targetType) {
    case "profile":
      return "Profil";
    case "business_pin":
      return "Business pin";
    case "business_application":
      return "İşletme başvurusu";
    case "community":
      return "Topluluk";
    case "community_event":
      return "Topluluk etkinliği";
    case "competition":
      return "Yarışma";
    case "competition_entry":
      return "Yarışma katılımı";
    case "feed_override":
      return "Feed override";
    case "support_note":
      return "Destek notu";
    case "report":
      return "Şikayet";
    case "message":
      return "Mesaj";
    default:
      return targetType;
  }
}

export function AuditTable({ entries }: { entries: AdminAuditEntry[] }) {
  return (
    <TableWrapper>
      <Table>
        <THead>
          <TR>
            <TH>Zaman</TH>
            <TH>Actor</TH>
            <TH>Aksiyon</TH>
            <TH>Hedef</TH>
            <TH>Özet</TH>
          </TR>
        </THead>
        <TBody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <TR key={entry.id}>
                <TD>{entry.createdAt}</TD>
                <TD>
                  <div className="space-y-xs">
                    <p className="font-medium text-text-primary">{entry.actorLabel}</p>
                    <Badge tone={roleTone(entry.actorRole)}>{entry.actorRole}</Badge>
                  </div>
                </TD>
                <TD>
                  <Badge tone={actionTone(entry.action)}>{actionLabel(entry.action)}</Badge>
                </TD>
                <TD>
                  <div className="space-y-xs">
                    <p className="font-medium text-text-primary">{targetLabel(entry.targetType)}</p>
                    <p className="text-xs text-text-tertiary">{entry.targetId}</p>
                  </div>
                </TD>
                <TD>{entry.summary}</TD>
              </TR>
            ))
          ) : (
            <TR>
              <TD className="py-xl text-sm text-text-secondary" colSpan={5}>
                Filtrelere uyan audit kaydı bulunamadı.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
