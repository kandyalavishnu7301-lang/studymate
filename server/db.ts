import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  college: string;
  course: string;
  branch: string;
  yearOfStudy: string;
  graduationYear: string;
  targetCgpa: string;
  targetCareer: string;
  preferredLanguage: string;
  dailyStudyTargetMinutes: number;
  primaryGoal: string;
  completedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  examDate: string;
  progress: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  topic: string;
  startTime: string;
  endTime: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  priority: 'Low' | 'Medium' | 'High';
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  durationMinutes: number;
  sessionType: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  notes?: string;
  completedAt: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  weakTopics: string[];
  answers: {
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
  }[];
  timeSpentSeconds: number;
  completedAt: string;
}

export interface DSAProblem {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  statement: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  hints: string[];
  solutionExplanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  testCases: {
    input: string;
    expected: string;
  }[];
}

export interface DSASubmission {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  submittedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  markAllocation?: number;
  codeSnippet?: string;
  model?: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: StudentProfile[];
  subjects: Subject[];
  tasks: StudyTask[];
  sessions: StudySession[];
  notes: Note[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  dsaProblems: DSAProblem[];
  dsaSubmissions: DSASubmission[];
  conversations: AIConversation[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'studymate.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to read db file, initializing default:', err);
      }
    }

    const initial = this.getInitialSeedData();
    this.persistSync(initial);
    return initial;
  }

  private persistSync(data: DatabaseSchema) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.data);
      this.saveTimeout = null;
    }, 100);
  }

  public flush() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.persistSync(this.data);
  }

  // Get schema
  public getData(): DatabaseSchema {
    return this.data;
  }

  // Helper methods for seed data
  private getInitialSeedData(): DatabaseSchema {
    const demoUserId = 'demo-user-alex-001';
    const now = new Date().toISOString();
    const demoPasswordHash = bcrypt.hashSync('alex123', 10);

    const demoUser: User = {
      id: demoUserId,
      email: 'alex@studymate.edu',
      passwordHash: demoPasswordHash,
      name: 'Alex Rivera',
      createdAt: now,
      updatedAt: now,
    };

    const demoProfile: StudentProfile = {
      id: 'prof-alex-001',
      userId: demoUserId,
      college: 'Stanford University / Tech Institute',
      course: 'B.Tech / B.S.',
      branch: 'Computer Science & Engineering',
      yearOfStudy: '3rd Year',
      graduationYear: '2026',
      targetCgpa: '9.2 / 4.0',
      targetCareer: 'Full-Stack & Systems Software Engineer',
      preferredLanguage: 'Python',
      dailyStudyTargetMinutes: 120,
      primaryGoal: 'Prepare for placements & exams',
      completedOnboarding: true,
      createdAt: now,
      updatedAt: now,
    };

    const subjects: Subject[] = [
      {
        id: 'subj-01',
        userId: demoUserId,
        name: 'Data Structures and Algorithms',
        code: 'CS301',
        difficulty: 'Hard',
        color: '#6366f1',
        examDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0],
        progress: 75,
        topics: [
          'Binary Trees & BST',
          'Dynamic Programming',
          'Graph Algorithms (BFS/DFS, Dijkstra)',
          'Sorting & Searching',
          'Heaps & Priority Queues'
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'subj-02',
        userId: demoUserId,
        name: 'Operating Systems',
        code: 'CS302',
        difficulty: 'Medium',
        color: '#06b6d4',
        examDate: new Date(Date.now() + 24 * 24 * 3600 * 1000).toISOString().split('T')[0],
        progress: 60,
        topics: [
          'Process Synchronization & Semaphores',
          'CPU Scheduling Algorithms',
          'Deadlock Detection & Banker Algorithm',
          'Virtual Memory & Page Replacement',
          'File Systems'
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'subj-03',
        userId: demoUserId,
        name: 'Computer Networks',
        code: 'CS303',
        difficulty: 'Medium',
        color: '#10b981',
        examDate: new Date(Date.now() + 32 * 24 * 3600 * 1000).toISOString().split('T')[0],
        progress: 50,
        topics: [
          'OSI & TCP/IP Reference Models',
          'Routing Algorithms (OSPF, BGP)',
          'TCP Congestion Control & 3-Way Handshake',
          'Subnetting & CIDR Addressing',
          'DNS & HTTP/3 Protocols'
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'subj-04',
        userId: demoUserId,
        name: 'Machine Learning',
        code: 'CS304',
        difficulty: 'Hard',
        color: '#ec4899',
        examDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
        progress: 40,
        topics: [
          'Linear & Logistic Regression',
          'Decision Trees & Random Forests',
          'Neural Networks & Backpropagation',
          'Dimensionality Reduction (PCA)',
          'Clustering & K-Means'
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const tasks: StudyTask[] = [
      {
        id: 'task-01',
        userId: demoUserId,
        subjectId: 'subj-01',
        subjectName: 'Data Structures and Algorithms',
        title: 'Master Binary Search Variations',
        topic: 'Binary Search',
        startTime: '18:00',
        endTime: '18:45',
        date: todayStr,
        difficulty: 'Medium',
        priority: 'High',
        estimatedMinutes: 45,
        completed: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-02',
        userId: demoUserId,
        subjectId: 'subj-02',
        subjectName: 'Operating Systems',
        title: 'Review CPU Scheduling & Gantt Charts',
        topic: 'CPU Scheduling',
        startTime: '19:00',
        endTime: '19:45',
        date: todayStr,
        difficulty: 'Medium',
        priority: 'High',
        estimatedMinutes: 45,
        completed: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-03',
        userId: demoUserId,
        subjectId: 'subj-01',
        subjectName: 'Data Structures and Algorithms',
        title: 'Solve 2 Graph Traversal Problems',
        topic: 'BFS and DFS Traversal',
        startTime: '20:00',
        endTime: '20:45',
        date: todayStr,
        difficulty: 'Hard',
        priority: 'Medium',
        estimatedMinutes: 45,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-04',
        userId: demoUserId,
        subjectId: 'subj-03',
        subjectName: 'Computer Networks',
        title: 'Practice CIDR Subnetting Math Quiz',
        topic: 'Subnetting & CIDR',
        startTime: '21:00',
        endTime: '21:30',
        date: todayStr,
        difficulty: 'Medium',
        priority: 'Low',
        estimatedMinutes: 30,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sessions: StudySession[] = [
      {
        id: 'sess-01',
        userId: demoUserId,
        subjectId: 'subj-01',
        subjectName: 'Data Structures and Algorithms',
        durationMinutes: 45,
        sessionType: 'pomodoro',
        notes: 'Focused on recursive binary search edge cases and boundary conditions.',
        completedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        createdAt: now,
      },
      {
        id: 'sess-02',
        userId: demoUserId,
        subjectId: 'subj-02',
        subjectName: 'Operating Systems',
        durationMinutes: 45,
        sessionType: 'pomodoro',
        notes: 'Calculated average turnaround time for Round Robin and SJF scheduling.',
        completedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        createdAt: now,
      },
    ];

    const notes: Note[] = [
      {
        id: 'note-01',
        userId: demoUserId,
        subjectId: 'subj-01',
        subjectName: 'Data Structures and Algorithms',
        title: 'Binary Search Edge Cases & Template',
        content: `### Binary Search Classic Invariant
When calculating midpoint in Python or C++:
\`\`\`python
# Avoid integer overflow in typed languages:
mid = low + (high - low) // 2
\`\`\`

#### Key Patterns:
1. **Search Exact Value**: \`while low <= high:\` return mid when found, else return -1.
2. **Lower Bound (First true)**: \`while low < high:\` update \`high = mid\` when condition holds.
3. **Rotated Sorted Array**: One half is guaranteed to be monotonically strictly sorted. Check if target lies within the sorted half!`,
        tags: ['DSA', 'Algorithms', 'Searching'],
        isPinned: true,
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'note-02',
        userId: demoUserId,
        subjectId: 'subj-02',
        subjectName: 'Operating Systems',
        title: 'Banker\'s Algorithm & Deadlock Avoidance',
        content: `### 4 Necessary Conditions for Deadlock:
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait

### Safe State vs Unsafe State
An unsafe state is **not** necessarily a deadlock, but deadlock can ONLY occur from an unsafe state.

\`\`\`
Need[i][j] = Max[i][j] - Allocation[i][j]
\`\`\`
If Need <= Available, the process can safely finish, releasing its Allocated resources back to Available!`,
        tags: ['OS', 'Deadlock', 'Concurrency'],
        isPinned: true,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sampleQuiz: Quiz = {
      id: 'quiz-01',
      userId: demoUserId,
      subjectId: 'subj-01',
      subjectName: 'Data Structures and Algorithms',
      title: 'Trees & Graph Traversal Core Quiz',
      topic: 'Binary Search Trees & Graphs',
      difficulty: 'Medium',
      questions: [
        {
          id: 'q-01',
          question: 'What is the worst-case time complexity of searching in an unbalanced Binary Search Tree (BST)?',
          options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(1)'],
          correctOptionIndex: 1,
          explanation: 'In the worst case, an unbalanced BST degenerates into a skewed linked list, resulting in O(N) search time.',
          topic: 'Binary Search Trees',
        },
        {
          id: 'q-02',
          question: 'Which algorithm is best suited to find the shortest path on an unweighted graph?',
          options: ['Dijkstra\'s Algorithm', 'Breadth-First Search (BFS)', 'Depth-First Search (DFS)', 'Bellman-Ford'],
          correctOptionIndex: 1,
          explanation: 'BFS explores nodes level by level, making it the most optimal O(V + E) algorithm for unweighted shortest path.',
          topic: 'Graph Algorithms',
        },
        {
          id: 'q-03',
          question: 'In Dijkstra\'s algorithm with a min-priority queue (binary heap), what is the time complexity?',
          options: ['O(V^2)', 'O((V + E) log V)', 'O(V log E)', 'O(E^2)'],
          correctOptionIndex: 1,
          explanation: 'Using a min-heap, extracting min takes O(log V) V times, and decrease-key takes O(log V) E times, yielding O((V + E) log V).',
          topic: 'Graph Algorithms',
        },
      ],
      createdAt: now,
    };

    const attempts: QuizAttempt[] = [
      {
        id: 'att-01',
        quizId: 'quiz-01',
        userId: demoUserId,
        quizTitle: 'Trees & Graph Traversal Core Quiz',
        score: 2,
        totalQuestions: 3,
        accuracy: 67,
        weakTopics: ['Graph Algorithms - Priority Queues'],
        answers: [
          { questionId: 'q-01', selectedOptionIndex: 1, isCorrect: true },
          { questionId: 'q-02', selectedOptionIndex: 1, isCorrect: true },
          { questionId: 'q-03', selectedOptionIndex: 0, isCorrect: false },
        ],
        timeSpentSeconds: 110,
        completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ];

    const dsaProblems: DSAProblem[] = [
      {
        id: 'dsa-01',
        title: 'Two Sum',
        slug: 'two-sum',
        category: 'Arrays & Hashing',
        difficulty: 'Easy',
        statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
          },
        ],
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.',
        ],
        hints: [
          'A brute-force solution checks all pairs in O(n^2) time. Can you do it in one pass?',
          'Use a hash map to store elements you have already seen: key = number, value = index.',
          'For each number x, check if (target - x) is already present in the map.',
        ],
        solutionExplanation: 'By using a hash map (dictionary), we can look up the complement `target - num` in O(1) average time. As we traverse the array, we check if the complement exists. If so, we return the pair of indices.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        starterCode: {
          python: `def twoSum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
          javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
          cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (seen.count(comp)) return {seen[comp], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
          java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
        },
        testCases: [
          { input: '[2,7,11,15], 9', expected: '[0,1]' },
          { input: '[3,2,4], 6', expected: '[1,2]' },
          { input: '[3,3], 6', expected: '[0,1]' },
        ],
      },
      {
        id: 'dsa-02',
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        category: 'Stack',
        difficulty: 'Easy',
        statement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        examples: [
          { input: 's = "()"', output: 'true' },
          { input: 's = "()[]{}"', output: 'true' },
          { input: 's = "(]"', output: 'false' },
        ],
        constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only `()[]{}`.'],
        hints: [
          'A stack is the natural data structure for matching nested elements.',
          'Push opening brackets onto the stack. When you encounter a closing bracket, verify the top of the stack matches.',
        ],
        solutionExplanation: 'Use a stack to track open brackets. Iterate through the string; if an opening bracket is found, push to stack. If a closing bracket is found, check if stack is non-empty and top matches. If not, return false.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        starterCode: {
          python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack`,
          javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if (map[c]) {
      if (stack.pop() !== map[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}`,
          cpp: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            if (c == ')' && st.top() != '(') return false;
            if (c == '}' && st.top() != '{') return false;
            if (c == ']' && st.top() != '[') return false;
            st.pop();
        }
    }
    return st.empty();
}`,
          java: `public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '{') stack.push('}');
        else if (c == '[') stack.push(']');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}`,
        },
        testCases: [
          { input: '"()"', expected: 'true' },
          { input: '"()[]{}"', expected: 'true' },
          { input: '"(]"', expected: 'false' },
        ],
      },
      {
        id: 'dsa-03',
        title: 'Reverse Linked List',
        slug: 'reverse-linked-list',
        category: 'Linked Lists',
        difficulty: 'Easy',
        statement: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
        examples: [
          { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
          { input: 'head = [1,2]', output: '[2,1]' },
        ],
        constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
        hints: [
          'Maintain three pointers: prev (initially null), curr (initially head), and next_node.',
          'At each step, save curr.next, flip curr.next = prev, advance prev = curr, and curr = next_node.',
        ],
        solutionExplanation: 'Iteratively rewire the next pointers in reverse order using `prev` and `curr` pointers in O(N) time and O(1) extra space.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        starterCode: {
          python: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
          javascript: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
          cpp: `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
          java: `public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
        },
        testCases: [
          { input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]' },
          { input: '[1,2]', expected: '[2,1]' },
        ],
      },
      {
        id: 'dsa-04',
        title: 'Binary Search',
        slug: 'binary-search',
        category: 'Searching',
        difficulty: 'Easy',
        statement: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
        examples: [
          { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
          { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' },
        ],
        constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All integers in nums are unique and sorted.'],
        hints: ['Divide and conquer by maintaining left and right pointers.', 'Calculate mid = left + (right - left) // 2 to avoid overflow.'],
        solutionExplanation: 'Compare the middle element with the target. If matched, return mid. If target is smaller, adjust right pointer. If larger, adjust left pointer.',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        starterCode: {
          python: `def search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
          javascript: `function search(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
          cpp: `int search(vector<int>& nums, int target) {
    int l = 0, r = nums.size() - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (nums[m] == target) return m;
        if (nums[m] < target) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
          java: `public int search(int[] nums, int target) {
    int l = 0, r = nums.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (nums[m] == target) return m;
        if (nums[m] < target) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
        },
        testCases: [
          { input: '[-1,0,3,5,9,12], 9', expected: '4' },
          { input: '[-1,0,3,5,9,12], 2', expected: '-1' },
        ],
      },
      {
        id: 'dsa-05',
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating-characters',
        category: 'Strings',
        difficulty: 'Medium',
        statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
        examples: [
          { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
          { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
          { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
        ],
        constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
        hints: ['Use sliding window with two pointers: left and right.', 'Maintain a hash map of character to its most recent index.'],
        solutionExplanation: 'Sliding window technique where `left` jumps to `max(left, last_seen[char] + 1)` whenever a duplicate is found.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(min(N, M))',
        starterCode: {
          python: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
          javascript: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (map.has(c) && map.get(c) >= left) {
      left = map.get(c) + 1;
    }
    map.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
          cpp: `int lengthOfLongestSubstring(string s) {
    unordered_map<char, int> last;
    int left = 0, ans = 0;
    for (int right = 0; right < s.size(); ++right) {
        if (last.count(s[right]) && last[s[right]] >= left) {
            left = last[s[right]] + 1;
        }
        last[s[right]] = right;
        ans = max(ans, right - left + 1);
    }
    return ans;
}`,
          java: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int left = 0, max = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (map.containsKey(c) && map.get(c) >= left) {
            left = map.get(c) + 1;
        }
        map.put(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}`,
        },
        testCases: [
          { input: '"abcabcbb"', expected: '3' },
          { input: '"bbbbb"', expected: '1' },
          { input: '"pwwkew"', expected: '3' },
        ],
      },
      {
        id: 'dsa-06',
        title: 'Coin Change',
        slug: 'coin-change',
        category: 'Dynamic Programming',
        difficulty: 'Medium',
        statement: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.',
        examples: [
          { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
          { input: 'coins = [2], amount = 3', output: '-1' },
          { input: 'coins = [1], amount = 0', output: '0' },
        ],
        constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
        hints: ['Bottom-up DP: dp[i] represents min coins to make amount i.', 'dp[i] = min(dp[i], dp[i - coin] + 1) for coin in coins.'],
        solutionExplanation: 'Initialize dp table of size amount + 1 with infinity, dp[0] = 0. Iterate each amount from 1 to total, checking all valid coin denominations.',
        timeComplexity: 'O(amount * len(coins))',
        spaceComplexity: 'O(amount)',
        starterCode: {
          python: `def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
          javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let x = coin; x <= amount; x++) {
      dp[x] = Math.min(dp[x], dp[x - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
          cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int i = coin; i <= amount; ++i) {
            dp[i] = min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
          java: `public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int i = coin; i <= amount; i++) {
            dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
        },
        testCases: [
          { input: '[1,2,5], 11', expected: '3' },
          { input: '[2], 3', expected: '-1' },
          { input: '[1], 0', expected: '0' },
        ],
      },
    ];

    const dsaSubmissions: DSASubmission[] = [
      {
        id: 'sub-01',
        userId: demoUserId,
        problemId: 'dsa-01',
        problemTitle: 'Two Sum',
        code: dsaProblems[0].starterCode.python,
        language: 'python',
        status: 'Accepted',
        passedTestCases: 3,
        totalTestCases: 3,
        executionTimeMs: 42,
        submittedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'sub-02',
        userId: demoUserId,
        problemId: 'dsa-04',
        problemTitle: 'Binary Search',
        code: dsaProblems[3].starterCode.python,
        language: 'python',
        status: 'Accepted',
        passedTestCases: 2,
        totalTestCases: 2,
        executionTimeMs: 35,
        submittedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
    ];

    const conversations: AIConversation[] = [
      {
        id: 'conv-01',
        userId: demoUserId,
        title: 'Explaining Semaphore vs Mutex for OS Exam',
        messages: [
          {
            id: 'msg-01',
            role: 'user',
            content: 'Can you explain the difference between a Mutex and a Semaphore? My professor asked this for a 4-mark exam question.',
            markAllocation: 4,
            timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          },
          {
            id: 'msg-02',
            role: 'assistant',
            content: `### Mutex vs. Semaphore (4 Marks Exam Answer)

Here is a structured, high-scoring breakdown tailored for a 4-mark question:

#### 1. Core Definition
* **Mutex (Mutual Exclusion Object)**: A locking mechanism used to synchronize access to a single shared resource. Only the thread that locks the mutex can unlock it (ownership concept).
* **Semaphore**: A signaling mechanism based on an integer counter (\`wait()\` / \`signal()\`) used to manage concurrent access to multiple identical resource instances.

#### 2. Comparison Table
| Feature | Mutex | Counting / Binary Semaphore |
| :--- | :--- | :--- |
| **Mechanism** | Locking | Signaling |
| **Ownership** | Strict (owned by acquiring thread) | No ownership (any thread can signal) |
| **Capacity** | Single resource access (1 at a time) | Multiple instances ($N$ resources) |
| **Operations** | \`lock()\` and \`unlock()\` | \`wait()\` (P) and \`signal()\` (V) |

#### Quick Checking Question
If a thread enters a critical section using a Counting Semaphore initialized to 3, what is the semaphore counter value right after it executes \`wait()\`?

*Think through this: Does it increment or decrement?*`,
            markAllocation: 4,
            timestamp: new Date(Date.now() - 6 * 3600 * 1000 + 15000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 3600 * 1000 + 15000).toISOString(),
      },
    ];

    return {
      users: [demoUser],
      profiles: [demoProfile],
      subjects,
      tasks,
      sessions,
      notes,
      quizzes: [sampleQuiz],
      attempts,
      dsaProblems,
      dsaSubmissions,
      conversations,
    };
  }
}

export const db = new DatabaseEngine();
