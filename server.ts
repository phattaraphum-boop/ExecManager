import express from "express";
import { createServer as createViteServer } from "vite";
import { getDb } from "./src/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  const db = getDb();

  // Get all appointments
  app.get("/api/appointments", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM appointments ORDER BY date, start_time");
      const appointments = stmt.all();
      res.json(appointments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Helper: Send LINE Notification
  const sendLineNotification = async (message: string) => {
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (!token) {
      console.log("Skipping LINE Notify: No token provided");
      return;
    }

    try {
      const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: new URLSearchParams({ message }).toString()
      });
      
      if (!response.ok) {
        console.error('LINE Notify failed:', await response.text());
      }
    } catch (error) {
      console.error('Error sending LINE notification:', error);
    }
  };

  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const {
        date,
        start_time,
        end_time,
        title,
        location,
        attendees,
        description,
        status,
        secretary_note
      } = req.body;

      const stmt = db.prepare(`
        INSERT INTO appointments (
          date, start_time, end_time, title, location, attendees, 
          description, status, secretary_note, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const info = stmt.run(
        date, start_time, end_time, title, location, attendees, 
        description, status || 'Pending', secretary_note
      );

      // Send LINE Notification
      const message = `\n🆕 New Appointment (นัดหมายใหม่)\n📅 Date: ${date}\n⏰ Time: ${start_time} - ${end_time}\n📝 Title: ${title}\n📍 Location: ${location || '-'}\n📊 Status: ${status || 'Pending'}`;
      await sendLineNotification(message);

      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Update appointment
  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        date,
        start_time,
        end_time,
        title,
        location,
        attendees,
        description,
        status,
        secretary_note,
        executive_feedback
      } = req.body;

      // Get old status to check for changes
      const oldAppt = db.prepare("SELECT status FROM appointments WHERE id = ?").get(id) as any;

      const stmt = db.prepare(`
        UPDATE appointments SET
          date = ?, start_time = ?, end_time = ?, title = ?, location = ?, 
          attendees = ?, description = ?, status = ?, secretary_note = ?, 
          executive_feedback = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        date, start_time, end_time, title, location, attendees, 
        description, status, secretary_note, executive_feedback, id
      );

      // Send LINE Notification if status changed or important update
      if (oldAppt && oldAppt.status !== status) {
         const message = `\n🔄 Status Update (อัปเดตสถานะ)\n📝 Title: ${title}\n📊 Old Status: ${oldAppt.status}\n➡️ New Status: ${status}\n📅 Date: ${date}`;
         await sendLineNotification(message);
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete appointment
  app.delete("/api/appointments/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("DELETE FROM appointments WHERE id = ?");
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
