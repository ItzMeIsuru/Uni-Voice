export const initialProblems = [
    {
        id: 1,
        title: "Canteen food quality has dropped recently",
        description: "The food at the main canteen has been really bad over the course of the last two weeks. Portions are smaller and it's always cold. We are paying the same prices though. Can we get this checked?",
        category: "Canteen/Food",
        score: 142,
        timeAgo: "2 hours ago",
        userVote: null,
        replies: [
            { id: 101, text: "Totally agree, got undercooked chicken yesterday.", timeAgo: "1 hour ago" },
            { id: 102, text: "Also the prices of drinks went up 20%!", timeAgo: "45 mins ago" }
        ]
    },
    {
        id: 2,
        title: "Wi-Fi in the library drops every 5 minutes",
        description: "I'm trying to do my final year project but the 'Campus_Student' wifi in the Central Library 2nd floor is absolutely unusable right now. Keeps dropping.",
        category: "Academic",
        score: 89,
        timeAgo: "5 hours ago",
        userVote: null,
        replies: [
            { id: 201, text: "The 3rd floor is even worse...", timeAgo: "2 hours ago" }
        ]
    },
    {
        id: 3,
        title: "Trash mountain near the faculty is unbearable",
        description: "There is a massive mountain of uncollected trash accumulating right next to our faculty building. It's a true problem for students trying to study, and the foul smell is really disturbing and distracting during lectures. This needs to be cleared immediately.",
        category: "Non-academic",
        score: 215,
        timeAgo: "1 day ago",
        userVote: 'up',
        replies: [
            { id: 301, text: "It's so bad today because of the heat.", timeAgo: "20 hours ago" }
        ]
    },
    {
        id: 4,
        title: "Lecture hall 4 AC is broken",
        description: "It's literally a sauna in LH4. Please fix the AC before tomorrow's 3-hour lecture.",
        category: "Academic",
        score: 12,
        timeAgo: "30 mins ago",
        userVote: null,
        replies: []
    },
    {
        id: 5,
        title: "Main gate security checking is taking way too long",
        description: "They changed the protocol today and now there is a 20-minute queue just to walk into campus. Many missed their 8am classes.",
        category: "Security",
        score: -5,
        timeAgo: "8 hours ago",
        userVote: 'down',
        replies: [
            { id: 501, text: "It's for our safety though. Minor inconvenience.", timeAgo: "7 hours ago" },
            { id: 502, text: "True, but they need more staff at prime time.", timeAgo: "6 hours ago" }
        ]
    }
];
