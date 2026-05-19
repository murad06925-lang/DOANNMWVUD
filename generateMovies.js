const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const genres = [
    "Hành Động / Viễn Tưởng",
    "Kinh Dị / Giật Gân",
    "Hoạt Hình / Gia Đình",
    "Tâm Lý / Tình Cảm",
    "Phiêu Lưu / Khoa Học"
];

const titles = [
    "AVENGERS: ENDGAME",
    "DORAEMON: ĐẢO GIẤU VÀNG",
    "LẬT MẶT 7",
    "CONAN: NGÔI SAO NĂM CÁNH",
    "THÁC ĐÈN MA QUÁI",
    "FAST X",
    "JOHN WICK 4",
    "SPIDER-MAN",
    "BATMAN RETURNS",
    "THE FLASH",
    "INTERSTELLAR",
    "INCEPTION",
    "JURASSIC WORLD",
    "MINIONS",
    "INSIDE OUT 2",
    "TRANSFORMERS",
    "VENOM",
    "BLACK PANTHER",
    "DOCTOR STRANGE",
    "AQUAMAN",
    "MATRIX",
    "MISSION IMPOSSIBLE",
    "TOP GUN",
    "TITANIC",
    "FROZEN",
    "COCO",
    "UP",
    "SOUL",
    "THE NUN",
    "ANNABELLE",
    "IT",
    "THE CONJURING",
    "MEG 2",
    "PACIFIC RIM",
    "GODZILLA",
    "KING KONG",
    "AVATAR",
    "DUNE",
    "OPPENHEIMER",
    "BARBIE"
];

const movies = titles.map((title, i) => ({
    _id: `m${i + 1}`,
    title,
    genre: genres[i % genres.length],
    duration: `${95 + Math.floor(Math.random() * 90)} phút`,
    rating: `${(4 + Math.random()).toFixed(1)}/5 (${1000 + i * 250} đánh giá)`,
    ratingStars: 4 + (i % 2),
    director: `Đạo diễn ${i + 1}`,
    cast: `Diễn viên A${i}, B${i}, C${i}`,
    description: `${title} là bom tấn hấp dẫn với cốt truyện lôi cuốn, kỹ xảo mãn nhãn và những pha hành động kịch tính. Bộ phim đưa khán giả vào chuyến phiêu lưu đầy cảm xúc với nhiều cú twist bất ngờ.`,
    poster: `https://picsum.photos/400/600?random=${i + 1}`,
    trailer: "https://www.youtube.com/embed/TcMBFSGVi1c"
}));

fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 4));

console.log("Đã tạo 40 phim!");