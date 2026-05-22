const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });

const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const SHOWTIMES_FILE = path.join(DATA_DIR, 'showtimes.json');

// Đảm bảo dữ liệu tồn tại
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// ==================== DỮ LIỆU TẠI BỘ NHỚ (Cải thiện hiệu năng) ====================
let showtimesData = [];
try {
    if (fs.existsSync(SHOWTIMES_FILE)) {
        showtimesData = JSON.parse(fs.readFileSync(SHOWTIMES_FILE, 'utf8'));
        // FIX LỖI: Reset trạng thái ghế về empty khi server restart
        showtimesData.forEach(st => {
            Object.keys(st.seats).forEach(seatId => {
                if (st.seats[seatId].status === 'selected') {
                    st.seats[seatId].status = 'empty';
                    st.seats[seatId].holder = null;
                }
            });
        });
    }
} catch (e) { console.error("Lỗi đọc dữ liệu:", e); }

function saveToDisk() {
    fs.writeFileSync(SHOWTIMES_FILE, JSON.stringify(showtimesData, null, 4));
}

// ==================== SOCKET.IO LOGIC ====================
const seatTimers = new Map(); // Dùng Map để quản lý timer chuyên nghiệp hơn

io.on('connection', socket => {
    
    socket.on('join-showtime', id => {
        socket.join(id);
        const st = showtimesData.find(x => x._id === id);
        if (st) socket.emit('init-seats', st.seats);
    });

    socket.on('toggle-seat', ({ showtimeId, seatId }) => {
        const st = showtimesData.find(x => x._id === showtimeId);
        if (!st || !st.seats[seatId]) return;

        const seat = st.seats[seatId];

        if (seat.status === 'booked') return;

        if (seat.status === 'empty') {
            // Chọn ghế
            seat.status = 'selected';
            seat.holder = socket.id;

            // Timer tự động hủy nếu không thanh toán (5 phút)
            const timerKey = `${showtimeId}_${seatId}`;
            clearTimeout(seatTimers.get(timerKey));
            
            seatTimers.set(timerKey, setTimeout(() => {
                if (seat.status === 'selected' && seat.holder === socket.id) {
                    seat.status = 'empty';
                    seat.holder = null;
                    saveToDisk();
                    io.to(showtimeId).emit('seat-updated', { seatId, status: 'empty', holder: null });
                }
            }, 5 * 60 * 1000));

        } else if (seat.status === 'selected' && seat.holder === socket.id) {
            // Bỏ chọn
            seat.status = 'empty';
            seat.holder = null;
            clearTimeout(seatTimers.get(`${showtimeId}_${seatId}`));
        }

        saveToDisk();
        io.to(showtimeId).emit('seat-updated', { seatId, status: seat.status, holder: seat.holder });
    });

    socket.on('disconnect', () => {
        // Tự động giải phóng ghế khi user thoát
        showtimesData.forEach(st => {
            let changed = false;
            Object.keys(st.seats).forEach(seatId => {
                const seat = st.seats[seatId];
                if (seat.status === 'selected' && seat.holder === socket.id) {
                    seat.status = 'empty';
                    seat.holder = null;
                    changed = true;
                    io.to(st._id).emit('seat-updated', { seatId, status: 'empty', holder: null });
                }
            });
            if (changed) saveToDisk();
        });
    });
});

// 1. Các Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. TẤT CẢ CÁC API ROUTES PHẢI NẰM Ở ĐÂY
app.get('/api/cinemas', (req, res) => {
    res.json([
        { id: "c1", name: "CGV Vincom" },
        { id: "c2", name: "CGV Crescent Mall" }
    ]);
});

app.post('/api/register', (req, res) => {
    console.log("Dữ liệu đăng ký:", req.body);
    res.status(200).json({ success: true, message: "Đăng ký thành công!" });
});

// Route dùng Query Param (Sửa lỗi cho URL /api/showtimes?movieId=m1)
app.get('/api/showtimes', (req, res) => {
    const movieId = req.query.movieId;
    if (movieId) {
        res.json(showtimesData.filter(s => s.movieId === movieId));
    } else {
        res.json(showtimesData);
    }
});

// Route cũ (giữ lại nếu bạn vẫn muốn dùng kiểu /api/showtimes/:movieId)
app.get('/api/showtimes/:movieId', (req, res) => {
    res.json(showtimesData.filter(s => s.movieId === req.params.movieId));
});

// 3. CUỐI CÙNG MỚI LÀ LỆNH KHỞI CHẠY SERVER
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));