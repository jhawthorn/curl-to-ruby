curl-to-ruby
============

[![Build Status](https://travis-ci.org/jhawthorn/curl-to-ruby.svg?branch=gh-pages)](https://travis-ci.org/jhawthorn/curl-to-ruby)

curl-to-ruby is a tool to instantly convert [curl](http://curl.haxx.se) commands to ruby code using [net/http](http://ruby-doc.org/stdlib-2.1.1/libdoc/net/http/rdoc/Net/HTTP.html) in the browser. It does *not* guarantee high-fidelity conversions, but it's good enough for most API docs that have curl samples.

### Try it

**[Check it out!](https://jhawthorn.github.io/curl-to-ruby)** It works inside your browser.


### FAQ

#### Does any curl command work?

Any curl command should work, but only certain flags are understood and converted into ruby code. The rest of the flags will be ignored.

#### Which kinds of curl commands are understood?

Mostly simple HTTP commands (headers, basic auth, body, etc).

#### Will you consider supporting *this-or-that* flag?

curl has like a bajillion options, so don't expect all of them to be implemented; just the most common/important ones to stub out code from API samples and docs, etc. But feel free to open an issue or submit a pull request!



### Credits

Updated to ruby by John Hawthorn ([jhawthorn](https://twitter.com/jhawthorn))

Based on [curl-to-Go](https://github.com/mholt/curl-to-go) by Matt Holt ([mholt6](https://twitter.com/mholt6)).
