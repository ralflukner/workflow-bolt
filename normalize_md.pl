#!/usr/bin/env perl

use strict;
use warnings;
use File::Find;

# Find all markdown files, excluding node_modules and vendor directories
find(
    {
        wanted => sub {
            return unless -f && /\.md$/;
            return if $File::Find::name =~ /node_modules|vendor/;
            
            print "Processing $File::Find::name\n";
            
            # Read the file
            open my $in, '<', $_ or die "Cannot open $_ for reading: $!";
            my $content = do { local $/; <$in> };
            close $in;
            
            # Normalize blank lines
            $content =~ s/\n{3,}/\n\n/g;  # Replace 3+ newlines with 2
            
            # Ensure file ends with exactly one newline
            $content =~ s/\n*$/\n/;
            
            # Write the file
            open my $out, '>', $_ or die "Cannot open $_ for writing: $!";
            print $out $content;
            close $out;
            
            print "Done processing $File::Find::name\n";
        },
        no_chdir => 1
    },
    '.'
);

print "All markdown files processed.\n";