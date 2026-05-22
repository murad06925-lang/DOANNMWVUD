const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Thay vì const PORT = 3000;
const PORT = process.env.PORT || 3000;
// Đường dẫn lưu trữ database dạng file JSON
const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const SHOWTIMES_FILE = path.join(DATA_DIR, 'showtimes.json');

// Tạo thư mục data nếu chưa tồn tại
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Hàm hỗ trợ đọc/ghi dữ liệu an toàn
function readData(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Lỗi đọc file ${filePath}:`, e);
        return null;
    }
}

function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
        console.error(`Lỗi ghi file ${filePath}:`, e);
    }
}

// Hàm khởi tạo 40 ghế cho phòng chiếu
function generateInitialSeats() {
    const seats = {};
    const rows = ['A', 'B', 'C', 'D', 'E'];
    rows.forEach(row => {
        for (let i = 1; i <= 8; i++) {
            const id = `${row}${i}`;
            let type = 'thuong';
            let price = 60000;
            
            if (row === 'D' || row === 'E') {
                type = 'vip';
                price = 90000;
            }
            if (row === 'E' && (i === 7 || i === 8)) {
                type = 'doi';
                price = 140000;
            }
            seats[id] = { status: 'empty', type, price, holder: null };
        }
    });
    return seats;
}

// ==================== TÍCH HỢP KHO DỮ LIỆU MẶC ĐỊNH ====================

// 1. Khởi tạo 5 phim bom tấn đầy đủ Trailer & Đánh giá
let moviesData = readData(MOVIES_FILE);
if (!moviesData || !Array.isArray(moviesData) || moviesData.length === 0) {
   moviesData = Array.from({ length: 40 }, (_, i) => ({
    _id: `m${i + 1}`,
    title: [
        "AVENGERS: ENDGAME",
        "DORAEMON: ĐẢO GIẤU VÀNG",
        "LẬT MẶT 7",
        "CONAN: NGÔI SAO NĂM CÁNH",
        "THÁC ĐÈN MA QUÁI",
        "SPIDER-MAN: NO WAY HOME",
        "JOHN WICK 4",
        "FAST X",
        "THE BATMAN",
        "OPPENHEIMER"
    ][i % 10] + ` ${Math.floor(i / 10) + 1}`,

    genre: [
        "Hành Động / Viễn Tưởng",
        "Hoạt Hình / Gia Đình",
        "Tâm Lý / Gia Đình",
        "Trinh Thám",
        "Kinh Dị"
    ][i % 5],

    duration: `${100 + i * 2} phút`,
    rating: `${(4 + (i % 10) / 10).toFixed(1)}/5`,
    ratingStars: 4 + (i % 2),

    director: [
        "Anthony Russo",
        "Lý Hải",
        "Christopher Nolan",
        "Matt Reeves",
        "Chad Stahelski"
    ][i % 5],

    cast: [
        "Robert Downey Jr., Chris Evans",
        "Tom Holland, Zendaya",
        "Keanu Reeves",
        "Dakota Fanning",
        "Thanh Hiền"
    ][i % 5],

    description: `Đây là phần mô tả chi tiết của phim số ${i + 1}. Nội dung xoay quanh những tình tiết hấp dẫn, cao trào kịch tính và các nhân vật đầy chiều sâu.`,

    poster: `https://picsum.photos/400/600?random=${i + 1}`,

    trailer: "https://www.youtube.com/embed/TcMBFSGVi1c"
}));
writeData(MOVIES_FILE, moviesData);
}

// 2. Khởi tạo Suất chiếu tương ứng cho cả 5 phim
let showtimesData = readData(SHOWTIMES_FILE);
if (!showtimesData || !Array.isArray(showtimesData) || showtimesData.length === 0) {
    showtimesData = [
        { _id: "st1", movieId: "m1", time: "18:00", room: "Phòng chiếu 1 (IMAX)", seats: generateInitialSeats() },
        { _id: "st2", movieId: "m2", time: "20:00", room: "Phòng chiếu 2 (2D)", seats: generateInitialSeats() },
        { _id: "st3", movieId: "m3", time: "19:30", room: "Phòng chiếu 3 (Premium)", seats: generateInitialSeats() },
        { _id: "st4", movieId: "m4", time: "17:15", room: "Phòng chiếu 4 (2D)", seats: generateInitialSeats() },
        { _id: "st5", movieId: "m5", time: "22:45", room: "Phòng chiếu 5 (L'amour Giường Nằm)", seats: generateInitialSeats() }
    ];
    writeData(SHOWTIMES_FILE, showtimesData);
}

// Cấu hình Middleware phục vụ file tĩnh
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==================== ĐỊNH TUYẾN API (ROUTES) ====================

// API lấy toàn bộ danh sách phim
app.get('/api/movies', (req, res) => {
    const currentMovies = readData(MOVIES_FILE) || moviesData;
    res.json(currentMovies);
});

// API lấy suất chiếu dựa theo id phim
app.get('/api/showtimes/:movieId', (req, res) => {
    const currentShowtimes = readData(SHOWTIMES_FILE) || showtimesData;
    const filtered = currentShowtimes.filter(s => s.movieId === req.params.movieId);
    res.json(filtered);
});

// ==================== LOGIC SOCKET.IO REALTIME ====================
io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('join-showtime', (showtimeId) => {
        if(currentRoom) socket.leave(currentRoom);
        currentRoom = showtimeId;
        socket.join(currentRoom);

        const currentShowtimes = readData(SHOWTIMES_FILE) || showtimesData;
        const st = currentShowtimes.find(s => s._id === showtimeId);
        if (st) {
            socket.emit('init-seats', st.seats);
        }
    });

    socket.on('toggle-seat', ({ showtimeId, seatId }) => {
        const currentShowtimes = readData(SHOWTIMES_FILE) || showtimesData;
        const st = currentShowtimes.find(s => s._id === showtimeId);
        if (!st || !st.seats[seatId]) return;

        const seat = st.seats[seatId];
        if (seat.status === 'booked') return;

        if (seat.status === 'empty') {
            seat.status = 'selected';
            seat.holder = socket.id;
        } else if (seat.status === 'selected' && seat.holder === socket.id) {
            seat.status = 'empty';
            seat.holder = null;
        } else {
            return; // Ghế đang bị người khác chọn
        }

        writeData(SHOWTIMES_FILE, currentShowtimes);
        io.to(showtimeId).emit('seat-updated', { seatId, status: seat.status, holder: seat.holder });
    });

    socket.on('confirm-booking', ({ showtimeId, totalAmount }) => {
        const currentShowtimes = readData(SHOWTIMES_FILE) || showtimesData;
        const st = currentShowtimes.find(s => s._id === showtimeId);
        if (!st) return;

        let hasSeats = false;
        for (const id in st.seats) {
            if (st.seats[id].status === 'selected' && st.seats[id].holder === socket.id) {
                st.seats[id].status = 'booked';
                st.seats[id].holder = null;
                hasSeats = true;
            }
        }

        if (hasSeats) {
            writeData(SHOWTIMES_FILE, currentShowtimes);
            const ticketCode = 'CGV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            // Cập nhật lại giao diện ghế cho phòng chiếu đó
            io.to(showtimeId).emit('init-seats', st.seats);
            socket.emit('booking-success', { ticketCode });
        }
    });

    socket.on('disconnect', () => {
        const currentShowtimes = readData(SHOWTIMES_FILE) || showtimesData;
        let changed = false;

        currentShowtimes.forEach(st => {
            for (const id in st.seats) {
                if (st.seats[id].status === 'selected' && st.seats[id].holder === socket.id) {
                    st.seats[id].status = 'empty';
                    st.seats[id].holder = null;
                    changed = true;
                    io.to(st._id).emit('seat-updated', { seatId: id, status: 'empty', holder: null });
                }
            }
        });

        if (changed) writeData(SHOWTIMES_FILE, currentShowtimes);
    });
});


// Kích hoạt server lắng nghe
server.listen(PORT, () => {
    console.log(`🚀 Hệ thống rạp phim chạy mượt mà tại: http://localhost:${PORT}`);
});
