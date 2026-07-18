"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  titulo: string;
  mensaje: string | null;
  enlace: string | null;
  leida: boolean;
  creado_en: string;
};

export function NotificationBell() {
  const router = useRouter();
  const shell = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((notification) => !notification.leida).length;

  async function loadNotifications() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setAuthenticated(Boolean(user));
    if (!user) return;

    const { data } = await supabase
      .from("notificaciones")
      .select("id,titulo,mensaje,enlace,leida,creado_en")
      .order("creado_en", { ascending: false })
      .limit(20);

    setNotifications((data || []) as Notification[]);
  }

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    const refresh = () => void loadNotifications();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (shell.current && !shell.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function readNotification(notification: Notification) {
    if (!notification.leida) {
      const supabase = createClient();
      await supabase.from("notificaciones").update({ leida: true }).eq("id", notification.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, leida: true } : item));
    }
    setOpen(false);
    if (notification.enlace) router.push(notification.enlace);
  }

  async function readAll() {
    const ids = notifications.filter((notification) => !notification.leida).map((notification) => notification.id);
    if (!ids.length) return;
    const supabase = createClient();
    await supabase.from("notificaciones").update({ leida: true }).in("id", ids);
    setNotifications((current) => current.map((item) => ({ ...item, leida: true })));
  }

  if (!authenticated) return null;

  return <div className="notification-shell" ref={shell}>
    <button className="notification-bell" type="button" aria-label={`Notificaciones: ${unread} sin leer`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">🔔</span>
      {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
    </button>

    {open && <section className="notification-panel" aria-label="Notificaciones">
      <header><div><strong>Notificaciones</strong><span>{unread} sin leer</span></div>{unread > 0 && <button type="button" onClick={readAll}>Marcar todas</button>}</header>
      <div className="notification-list">
        {notifications.map((notification) => <button className={notification.leida ? "read" : "unread"} type="button" key={notification.id} onClick={() => readNotification(notification)}>
          <strong>{notification.titulo}</strong>
          {notification.mensaje && <span>{notification.mensaje}</span>}
          <small>{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(notification.creado_en))}</small>
        </button>)}
        {!notifications.length && <p>No hay notificaciones por el momento.</p>}
      </div>
    </section>}

    <style jsx>{`
      .notification-shell{position:fixed;right:215px;top:15px;z-index:42}.notification-bell{position:relative;display:grid;place-items:center;width:48px;height:48px;border:1px solid #ffffff55;border-radius:50%;background:#164653;color:white;cursor:pointer;box-shadow:0 7px 20px #00182035}.notification-bell>span{font-size:21px}.notification-bell b{position:absolute;right:-3px;top:-4px;display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#efb93f;color:#18343e;font-size:11px}.notification-panel{position:absolute;right:0;top:57px;width:min(380px,calc(100vw - 28px));overflow:hidden;border:1px solid #b9c9cd;border-radius:13px;background:white;color:#173b49;box-shadow:0 20px 50px #00182045}.notification-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #d6e0e2}.notification-panel header div{display:grid;gap:2px}.notification-panel header strong{font-size:18px}.notification-panel header span{font-size:12px;color:#587078}.notification-panel header button{border:0;background:transparent;color:#0b5264;font-weight:900;cursor:pointer}.notification-list{max-height:min(62vh,520px);overflow-y:auto}.notification-list>button{display:grid;width:100%;gap:5px;padding:15px 17px;border:0;border-bottom:1px solid #e0e7e9;background:white;color:#173b49;text-align:left;cursor:pointer}.notification-list>button.unread{border-left:5px solid #efb93f;background:#f4fafb}.notification-list>button:hover{background:#eaf4f6}.notification-list span{font-size:14px;line-height:1.4}.notification-list small{color:#637a81}.notification-list p{padding:22px;text-align:center;color:#637a81}
      :global(:root[data-theme="dark"]) .notification-panel{border-color:#49636c;background:#18343e;color:#f2f7f8}:global(:root[data-theme="dark"]) .notification-panel>header{border-color:#49636c}:global(:root[data-theme="dark"]) .notification-panel header span,:global(:root[data-theme="dark"]) .notification-list small{color:#b7c9ce}:global(:root[data-theme="dark"]) .notification-panel header button{color:#9ed9e5}:global(:root[data-theme="dark"]) .notification-list>button{border-color:#36505a;background:#18343e;color:#eef6f7}:global(:root[data-theme="dark"]) .notification-list>button.unread{background:#21424d}:global(:root[data-theme="dark"]) .notification-list>button:hover{background:#28505c}
      @media(max-width:850px){.notification-shell{right:72px;top:12px}.notification-bell{width:48px;height:48px}.notification-panel{position:fixed;right:14px;top:70px}}
    `}</style>
  </div>;
}
