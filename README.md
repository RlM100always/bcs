# বিসিএস লিখিত — বাংলাদেশ বিষয়াবলি

**বিষয় কোড ০০৫ · মোট নম্বর ২০০ · ১৬ অধ্যায়**

বাংলাদেশের ইতিহাস, ভূগোল, সমাজ, অর্থনীতি ও রাষ্ট্রব্যবস্থা নিয়ে বাংলা পাঠ্যবই। ধারণার ব্যাখ্যা, কারণ–প্রভাব, বাংলাদেশের উদাহরণ এবং প্রশ্ন অনুযায়ী উত্তর লেখার অনুশীলন একসঙ্গে রাখা হয়েছে।

## বই পড়ুন

**[অধ্যায়সূচি ও পাঠের নির্দেশনা](./Bangladesh%20Affairs/README.md)**

- [সরকারি সিলেবাস ও বিষয়বিন্যাস](./Bangladesh%20Affairs/SYLLABUS-COVERAGE.md)
- [লিখিত উত্তর লেখার নির্দেশিকা](./Bangladesh%20Affairs/ANSWER-WRITING.md)
- [উৎস ও Fact-Checking-এর অবস্থা](./Bangladesh%20Affairs/SOURCE-AUDIT.md)
- [সম্পাদনা, ভাষা ও তথ্যসূত্রের মানদণ্ড](./Bangladesh%20Affairs/EDITORIAL-STANDARD.md)

প্রতিটি অধ্যায়ের প্রথম অংশে মূলপাঠ আছে। প্রশ্নোত্তর, পুনরালোচনা ও উৎস পৃথক অংশে। সরকারি সিলেবাসের পরিদর্শিত পাঠে বাংলাদেশ বিষয়াবলি **পৃষ্ঠা ৬**-এ; পৃষ্ঠা ৭ থেকে আন্তর্জাতিক বিষয়াবলি শুরু।

## তথ্যের ব্যবহার

উৎসের লিংক থাকা এবং নির্দিষ্ট দাবি মূল উৎসে যাচাই করা আলাদা কাজ। পরিবর্তনশীল পরিসংখ্যানের সময়কাল, আইনের প্রযোজ্য পাঠ এবং প্রশ্নের মূল উৎস মিলিয়ে ব্যবহার করুন। যাচাইয়ের প্রকৃত অবস্থা [উৎস-নিরীক্ষায়](./Bangladesh%20Affairs/SOURCE-AUDIT.md) আছে। বইটি BPSC-এর অনুমোদিত প্রকাশনা নয়।

## Repository checks

With Node.js 24 and Python 3 installed:

```bash
npm ci --ignore-scripts
npm run check
```

These checks validate Markdown file links and anchors, unresolved merge markers, local image paths, SVG syntax, cached-photo checksums and attribution records. They run on pushes and pull requests. They do not verify factual accuracy or remote URL availability.

The image check also runs independently with `python3 tools/check_images.py`. In this cloud workspace, use `npm ci --ignore-scripts --cache /tmp/bcs-npm-cache` if the default npm cache is not writable.

[Image credits and licences](./Bangladesh%20Affairs/assets/photos/SOURCES.md).
